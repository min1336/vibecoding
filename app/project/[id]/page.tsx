import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { IframePreview } from "@/components/preview/iframe-preview";
import Image from "next/image";
import { DownloadButton } from "./download-button";
import { DeleteButton } from "./delete-button";
import { LikeButton } from "./like-button";
import { CommentSection } from "./comment-section";
import { ProjectSidebar } from "./project-sidebar";
import { ViewTracker } from "./view-tracker";
import type { Tag } from "@/lib/types";

export const revalidate = 60;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, profiles(*), project_tags(tags(*))")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Transform tags from junction table
  const tags: Tag[] = project.project_tags
    ?.map((pt: { tags: Tag }) => pt.tags)
    .filter(Boolean) ?? [];
  const projectWithTags = { ...project, tags };

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === project.user_id;

  let userHasLiked = false;
  if (user) {
    const { data: like } = await supabase
      .from("likes")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("project_id", id)
      .single();
    userHasLiked = !!like;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <ViewTracker projectId={id} />

      {project.preview_url ? (
        <IframePreview previewUrl={project.preview_url} />
      ) : (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800">
          <Image src={project.screenshot_url} alt={project.title} fill className="object-cover" priority />
        </div>
      )}

      <div className="mt-6 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold break-words">{project.title}</h1>

          {project.description && (
            <p className="mt-3 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {project.description}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <LikeButton
              projectId={id}
              initialLiked={userHasLiked}
              initialCount={project.likes_count ?? 0}
              isAuthenticated={!!user}
            />
            <DownloadButton projectId={id} />
            {isOwner && <DeleteButton projectId={id} />}
          </div>

          <CommentSection projectId={id} userId={user?.id ?? null} />
        </div>

        <ProjectSidebar project={projectWithTags} />
      </div>
    </div>
  );
}
