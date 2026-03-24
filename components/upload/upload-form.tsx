"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MAX_FILE_SIZE,
  MAX_SCREENSHOT_SIZE,
  ALLOWED_IMAGE_TYPES,
  TOOLS,
  CATEGORIES,
} from "@/lib/constants";
import { TagInput } from "./tag-input";

export function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError("PNG, JPG, WebP, GIF 이미지만 허용됩니다");
        return;
      }
      if (file.size > MAX_SCREENSHOT_SIZE) {
        setError("스크린샷은 5MB 이하만 허용됩니다");
        return;
      }
      setError(null);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    const formData = new FormData(formRef.current!);
    const projectFile = formData.get("project_file") as File;

    if (projectFile.size > MAX_FILE_SIZE) {
      setError("프로젝트 파일은 50MB 이하만 허용됩니다");
      setUploading(false);
      return;
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "업로드 실패");
        setUploading(false);
        return;
      }

      router.push(`/project/${data.id}`);
      router.refresh();
    } catch {
      setError("업로드 중 오류가 발생했습니다");
      setUploading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          제목 <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="프로젝트 이름"
          className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          설명
        </label>
        <textarea
          name="description"
          maxLength={500}
          rows={3}
          placeholder="프로젝트에 대한 간단한 설명"
          className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          스크린샷 <span className="text-red-400">*</span>
        </label>
        <input
          name="screenshot"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleScreenshotChange}
          className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-zinc-300 file:font-medium hover:file:bg-zinc-700 file:cursor-pointer"
        />
        {screenshotPreview && (
          <img
            src={screenshotPreview}
            alt="미리보기"
            className="mt-3 rounded-lg max-h-48 object-cover border border-zinc-700"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          프로젝트 파일 (ZIP) <span className="text-red-400">*</span>
        </label>
        <input
          name="project_file"
          type="file"
          required
          accept=".zip"
          className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-zinc-300 file:font-medium hover:file:bg-zinc-700 file:cursor-pointer"
        />
        <p className="mt-1 text-xs text-zinc-600">
          index.html이 포함된 ZIP 파일이면 자동으로 프리뷰가 생성됩니다
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          사용 도구
        </label>
        <select
          name="tool_used"
          className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">선택 안함</option>
          {TOOLS.map((tool) => (
            <option key={tool} value={tool}>
              {tool}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          카테고리
        </label>
        <select
          name="category"
          className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">선택 안함</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          태그
        </label>
        <TagInput name="tags" />
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? "업로드 중..." : "프로젝트 업로드"}
      </button>
    </form>
  );
}
