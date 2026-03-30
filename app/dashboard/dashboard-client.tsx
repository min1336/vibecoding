"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Eye, Heart, Play, Upload, X, ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";

type Device = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<Device, string> = {
  desktop: "w-full",
  tablet: "w-[768px]",
  mobile: "w-[375px]",
};

export function DashboardClient({
  initialProjects,
  isAuthenticated,
}: {
  initialProjects: Project[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [device, setDevice] = useState<Device>("desktop");

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    router.push("/upload");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            프로젝트를 업로드하고 바로 테스트하세요
          </p>
        </div>
        <Button onClick={handleUploadClick} className="gap-2">
          <Upload className="h-4 w-4" />
          업로드
        </Button>
      </div>

      {/* Project Grid */}
      {initialProjects.length === 0 ? (
        <div className="text-center py-24 space-y-3">
          <p className="text-lg text-muted-foreground">아직 프로젝트가 없습니다</p>
          <Button variant="outline" onClick={handleUploadClick}>
            첫 프로젝트 업로드하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialProjects.map((project) => (
            <Card
              key={project.id}
              className="overflow-hidden group py-0 gap-0"
            >
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={project.screenshot_url}
                  alt={project.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {project.preview_url && (
                    <Button
                      size="sm"
                      onClick={() => setPreviewProject(project)}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      테스트
                    </Button>
                  )}
                  <Link
                    href={`/project/${project.id}`}
                    className={buttonVariants({ size: "sm", variant: "secondary" })}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{project.title}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={project.profiles?.avatar_url || undefined}
                      alt=""
                    />
                    <AvatarFallback className="text-[10px]">
                      {project.profiles?.display_name?.[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {project.profiles?.display_name || "Anonymous"}
                  </span>
                  {project.tool_used && (
                    <Badge variant="secondary" className="text-[10px]">
                      {project.tool_used}
                    </Badge>
                  )}
                  <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {project.likes_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {project.views_count ?? 0}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog
        open={!!previewProject}
        onOpenChange={(open) => !open && setPreviewProject(null)}
      >
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0 flex flex-col [&>button]:hidden">
          {previewProject && (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-medium truncate max-w-[300px]">
                    {previewProject.title}
                  </h2>
                  {previewProject.tool_used && (
                    <Badge variant="secondary">{previewProject.tool_used}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* Device toggles */}
                  <Button
                    variant={device === "desktop" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDevice("desktop")}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={device === "tablet" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDevice("tablet")}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={device === "mobile" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDevice("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-5 bg-border mx-2" />
                  <Link
                    href={`/project/${previewProject.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    상세 페이지
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPreviewProject(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Preview iframe */}
              <div className="flex-1 bg-zinc-950 flex items-start justify-center overflow-auto p-4">
                <div
                  className={`${deviceWidths[device]} h-full mx-auto transition-all duration-300 ${
                    device !== "desktop" ? "border border-border rounded-lg overflow-hidden" : ""
                  }`}
                >
                  <iframe
                    sandbox="allow-scripts"
                    src={previewProject.preview_url!}
                    title={`${previewProject.title} 프리뷰`}
                    className="w-full h-full bg-white"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
