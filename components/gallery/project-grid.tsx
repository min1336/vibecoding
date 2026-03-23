import type { Project } from "@/lib/types";
import { ProjectCard } from "./project-card";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="text-xl font-semibold text-zinc-300 mb-2">
          아직 프로젝트가 없어요
        </h2>
        <p className="text-zinc-500 mb-6">
          첫 번째 바이브코딩 프로젝트를 업로드해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
