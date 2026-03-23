import JSZip from "jszip";
import {
  MAX_UNZIP_SIZE,
  MAX_ZIP_ENTRIES,
  MAX_INLINE_IMAGE_SIZE,
  DANGEROUS_EXTENSIONS,
} from "./constants";

const IMAGE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:;">`;

export async function extractPreview(
  zipBuffer: ArrayBuffer
): Promise<string | null> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const entries = Object.keys(zip.files);

  // 보안: 엔트리 수 제한
  if (entries.length > MAX_ZIP_ENTRIES) return null;

  // 보안: path traversal 검사
  if (entries.some((e) => e.includes(".."))) return null;

  // 보안: 위험한 파일 확장자 검사
  if (entries.some((e) => DANGEROUS_EXTENSIONS.some((ext) => e.toLowerCase().endsWith(ext)))) {
    return null;
  }

  // index.html 찾기
  let indexPath: string | undefined = entries.find((e) => e === "index.html");
  if (!indexPath) {
    indexPath = entries.find((e) => e.endsWith("/index.html"));
  }
  if (!indexPath) return null;

  const basePath = indexPath.includes("/")
    ? indexPath.substring(0, indexPath.lastIndexOf("/") + 1)
    : "";

  // 압축 해제 크기 추적
  let totalSize = 0;
  const fileContents = new Map<string, Buffer>();

  for (const entry of entries) {
    if (zip.files[entry].dir) continue;
    const content = await zip.files[entry].async("nodebuffer");
    totalSize += content.length;
    if (totalSize > MAX_UNZIP_SIZE) return null;
    fileContents.set(entry, content);
  }

  let html = fileContents.get(indexPath)?.toString("utf-8") ?? "";

  // <base> 태그 제거
  html = html.replace(/<base[^>]*>/gi, "");

  // CSS 인라인화: <link rel="stylesheet" href="...">
  html = html.replace(
    /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
    (_match, href) => {
      if (href.startsWith("http://") || href.startsWith("https://")) return "";
      const cssPath = resolvePath(basePath, href);
      const css = fileContents.get(cssPath)?.toString("utf-8");
      return css ? `<style>${css}</style>` : "";
    }
  );

  // JS 인라인화: <script src="...">
  html = html.replace(
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,
    (_match, src) => {
      if (src.startsWith("http://") || src.startsWith("https://")) return "";
      const jsPath = resolvePath(basePath, src);
      const js = fileContents.get(jsPath)?.toString("utf-8");
      return js ? `<script>${js}</script>` : "";
    }
  );

  // 이미지 인라인화: <img src="...">
  html = html.replace(
    /(<img\s+[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
    (_match, pre, src, post) => {
      if (src.startsWith("http://") || src.startsWith("https://")) return `${pre}${post}`;
      if (src.startsWith("data:")) return _match;
      const imgPath = resolvePath(basePath, src);
      const imgBuffer = fileContents.get(imgPath);
      if (!imgBuffer || imgBuffer.length > MAX_INLINE_IMAGE_SIZE) return `${pre}${post}`;
      const ext = "." + src.split(".").pop()?.toLowerCase();
      const mime = IMAGE_MIME[ext] || "application/octet-stream";
      const base64 = imgBuffer.toString("base64");
      return `${pre}data:${mime};base64,${base64}${post}`;
    }
  );

  // CSS 내 url() 이미지 인라인화
  html = html.replace(
    /url\(["']?(?!data:|http:|https:)([^"')]+)["']?\)/gi,
    (_match, urlPath) => {
      const resolved = resolvePath(basePath, urlPath);
      const buf = fileContents.get(resolved);
      if (!buf || buf.length > MAX_INLINE_IMAGE_SIZE) return "url()";
      const ext = "." + urlPath.split(".").pop()?.toLowerCase();
      const mime = IMAGE_MIME[ext] || "application/octet-stream";
      return `url(data:${mime};base64,${buf.toString("base64")})`;
    }
  );

  // CSP meta 태그 삽입
  if (html.includes("<head>")) {
    html = html.replace("<head>", `<head>\n${CSP_META}`);
  } else if (html.includes("<html>")) {
    html = html.replace("<html>", `<html><head>${CSP_META}</head>`);
  } else {
    html = `<!DOCTYPE html><html><head>${CSP_META}</head><body>${html}</body></html>`;
  }

  return html;
}

function resolvePath(basePath: string, relativePath: string): string {
  if (relativePath.startsWith("./")) {
    relativePath = relativePath.slice(2);
  }
  return basePath + relativePath;
}
