import type { Project } from "@/lib/types";
import { ProjectCard } from "./project-card";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-400 text-lg">아직 프로젝트가 없습니다</p>
        <p className="text-zinc-500 text-sm mt-2">첫 번째로 업로드해보세요!</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
