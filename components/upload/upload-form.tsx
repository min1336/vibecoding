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
import { AiDescribeButton } from "./ai-describe-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [toolUsed, setToolUsed] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
    formData.set("tool_used", toolUsed);
    formData.set("category", category);
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
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          제목 <span className="text-destructive">*</span>
        </label>
        <Input
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="프로젝트 이름"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">설명</label>
          <AiDescribeButton
            title={title}
            tool={toolUsed}
            category={category}
            onGenerated={setDescription}
          />
        </div>
        <Textarea
          name="description"
          maxLength={500}
          rows={3}
          placeholder="프로젝트에 대한 간단한 설명"
          className="resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          스크린샷 <span className="text-destructive">*</span>
        </label>
        <Input
          name="screenshot"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleScreenshotChange}
        />
        {screenshotPreview && (
          <img
            src={screenshotPreview}
            alt="미리보기"
            className="mt-3 rounded-lg max-h-48 object-cover border border-border"
          />
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          프로젝트 파일 (ZIP) <span className="text-destructive">*</span>
        </label>
        <Input
          name="project_file"
          type="file"
          required
          accept=".zip"
        />
        <p className="text-xs text-muted-foreground">
          index.html이 포함된 ZIP 파일이면 자동으로 프리뷰가 생성됩니다
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">사용 도구</label>
        <Select value={toolUsed} onValueChange={(v) => setToolUsed(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="선택 안함" />
          </SelectTrigger>
          <SelectContent>
            {TOOLS.map((tool) => (
              <SelectItem key={tool} value={tool}>{tool}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">카테고리</label>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="선택 안함" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">태그</label>
        <TagInput name="tags" />
      </div>

      <Button type="submit" disabled={uploading} className="w-full" size="lg">
        {uploading ? "업로드 중..." : "프로젝트 업로드"}
      </Button>
    </form>
  );
}
