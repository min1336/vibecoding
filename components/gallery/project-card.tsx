import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const profile = project.profiles;

  return (
    <Link href={`/project/${project.id}`} className="group block break-inside-avoid mb-4">
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:border-zinc-600 hover:shadow-lg hover:shadow-violet-500/5">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={project.screenshot_url}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-zinc-100 truncate">{project.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full" />
            )}
            <span className="text-xs text-zinc-400 truncate max-w-[120px]">
              {profile?.display_name || "Anonymous"}
            </span>
            {project.tool_used && (
              <>
                <span className="text-zinc-600">&middot;</span>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                  {project.tool_used}
                </span>
              </>
            )}
            <span className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
              <span title="Likes">{project.likes_count ?? 0}</span>
              <span title="Views">{project.views_count ?? 0}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
