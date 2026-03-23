import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { IframePreview } from "@/components/preview/iframe-preview";
import { DownloadButton } from "./download-button";
import { DeleteButton } from "./delete-button";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, profiles(*)")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === project.user_id;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{project.title}</h1>
        <div className="mt-2 flex items-center gap-3">
          {project.profiles?.avatar_url && (
            <img
              src={project.profiles.avatar_url}
              alt={project.profiles.display_name}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-sm text-zinc-400">
            {project.profiles?.display_name || "Anonymous"}
          </span>
          {project.tool_used && (
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              {project.tool_used}
            </span>
          )}
          <span className="text-xs text-zinc-600">
            {new Date(project.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>

      {project.preview_url ? (
        <IframePreview previewUrl={project.preview_url} />
      ) : (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800">
          <Image
            src={project.screenshot_url}
            alt={project.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {project.description && (
        <p className="mt-6 text-zinc-300 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <DownloadButton projectId={project.id} />
        {isOwner && <DeleteButton projectId={project.id} />}
      </div>
    </div>
  );
}
