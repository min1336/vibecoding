import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractPreview } from "@/lib/preview-extractor";
import { NextResponse } from "next/server";
import { MAX_FILE_SIZE, MAX_SCREENSHOT_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_FILE_TYPES, CATEGORIES, MAX_TAGS_PER_PROJECT, MAX_TAG_LENGTH } from "@/lib/constants";
import type { CategoryType } from "@/lib/constants";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const toolUsed = (formData.get("tool_used") as string) || null;
  const category = (formData.get("category") as string) || null;
  const tagsRaw = formData.get("tags") as string;
  const tagNames: string[] = tagsRaw ? JSON.parse(tagsRaw) : [];
  const screenshot = formData.get("screenshot") as File;
  const projectFile = formData.get("project_file") as File;

  // 검증
  if (!title || !screenshot || !projectFile) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
  }

  if (title.length > 100) {
    return NextResponse.json({ error: "제목은 100자 이내로 입력해주세요" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(screenshot.type)) {
    return NextResponse.json({ error: "PNG, JPG, WebP, GIF 이미지만 허용됩니다" }, { status: 400 });
  }

  if (screenshot.size > MAX_SCREENSHOT_SIZE) {
    return NextResponse.json({ error: "스크린샷은 5MB 이하만 허용됩니다" }, { status: 400 });
  }

  if (!ALLOWED_FILE_TYPES.includes(projectFile.type)) {
    return NextResponse.json({ error: "ZIP 파일만 허용됩니다" }, { status: 400 });
  }

  if (projectFile.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "프로젝트 파일은 50MB 이하만 허용됩니다" }, { status: 400 });
  }

  if (category && !CATEGORIES.includes(category as CategoryType)) {
    return NextResponse.json({ error: "유효하지 않은 카테고리입니다" }, { status: 400 });
  }

  if (tagNames.length > MAX_TAGS_PER_PROJECT) {
    return NextResponse.json({ error: `태그는 ${MAX_TAGS_PER_PROJECT}개까지 가능합니다` }, { status: 400 });
  }

  // 프로젝트 ID 생성
  const projectId = crypto.randomUUID();
  const storagePath = `${user.id}/${projectId}`;

  // 스크린샷 업로드
  const screenshotExt = screenshot.name.split(".").pop() || "png";
  const screenshotPath = `${storagePath}/screenshot.${screenshotExt}`;
  const screenshotBuffer = Buffer.from(await screenshot.arrayBuffer());

  const { error: ssError } = await admin.storage
    .from("screenshots")
    .upload(screenshotPath, screenshotBuffer, {
      contentType: screenshot.type,
    });

  if (ssError) {
    return NextResponse.json({ error: "스크린샷 업로드 실패" }, { status: 500 });
  }

  const { data: ssPublicUrl } = admin.storage
    .from("screenshots")
    .getPublicUrl(screenshotPath);

  // zip 파일 업로드
  const zipPath = `${storagePath}/project.zip`;
  const zipBuffer = Buffer.from(await projectFile.arrayBuffer());

  const { error: zipError } = await admin.storage
    .from("project-files")
    .upload(zipPath, zipBuffer, {
      contentType: "application/zip",
    });

  if (zipError) {
    return NextResponse.json({ error: "프로젝트 파일 업로드 실패" }, { status: 500 });
  }

  // 프리뷰 추출
  let previewPublicUrl: string | null = null;
  try {
    const previewHtml = await extractPreview(zipBuffer.buffer);
    if (previewHtml) {
      const previewPath = `${storagePath}/index.html`;
      const { error: prevError } = await admin.storage
        .from("previews")
        .upload(previewPath, Buffer.from(previewHtml, "utf-8"), {
          contentType: "text/html",
        });

      if (!prevError) {
        const { data: prevUrl } = admin.storage
          .from("previews")
          .getPublicUrl(previewPath);
        previewPublicUrl = prevUrl.publicUrl;
      }
    }
  } catch {
    // 프리뷰 추출 실패 시 스크린샷만 표시
  }

  // DB 레코드 삽입
  const { error: dbError } = await supabase.from("projects").insert({
    id: projectId,
    title,
    description,
    screenshot_url: ssPublicUrl.publicUrl,
    file_url: zipPath,
    preview_url: previewPublicUrl,
    tool_used: toolUsed,
    category,
    user_id: user.id,
  });

  if (dbError) {
    return NextResponse.json({ error: "프로젝트 저장 실패" }, { status: 500 });
  }

  // Tag upsert
  for (const tagName of tagNames) {
    const normalized = tagName.toLowerCase().trim();
    if (!normalized || normalized.length > MAX_TAG_LENGTH) continue;

    const { data: tag } = await supabase
      .from("tags")
      .upsert({ name: normalized }, { onConflict: "name" })
      .select("id")
      .single();

    if (tag) {
      await supabase
        .from("project_tags")
        .insert({ project_id: projectId, tag_id: tag.id });
    }
  }

  return NextResponse.json({ id: projectId });
}
