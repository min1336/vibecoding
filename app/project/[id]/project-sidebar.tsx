import Link from "next/link";
import type { Project } from "@/lib/types";

export function ProjectSidebar({ project }: { project: Project }) {
  return (
    <div className="space-y-4 w-full lg:w-72 flex-shrink-0">
      {/* Creator */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Creator</p>
        <Link href={`/profile/${project.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {project.profiles?.avatar_url && (
            <img src={project.profiles.avatar_url} alt="" className="w-10 h-10 rounded-full" />
          )}
          <span className="text-sm font-medium">{project.profiles?.display_name || "Anonymous"}</span>
        </Link>
      </div>

      {/* Tool */}
      {project.tool_used && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Tool</p>
          <p className="text-sm">{project.tool_used}</p>
        </div>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag.id} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Stats</p>
        <div className="flex gap-6">
          <div>
            <p className="text-lg font-semibold">{project.likes_count ?? 0}</p>
            <p className="text-xs text-zinc-500">Likes</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{project.views_count ?? 0}</p>
            <p className="text-xs text-zinc-500">Views</p>
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Published</p>
        <p className="text-sm">{new Date(project.created_at).toLocaleDateString("ko-KR")}</p>
      </div>
    </div>
  );
}
