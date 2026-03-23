import { createClient } from "@/lib/supabase/server";
import { ProjectGrid } from "@/components/gallery/project-grid";
import { LoadMoreButton } from "@/components/gallery/load-more-button";
import { PAGE_SIZE } from "@/lib/constants";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  const allProjects = projects ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          바이브코딩 갤러리
        </h1>
        <p className="mt-2 text-zinc-400">
          AI로 만든 멋진 프로젝트들을 구경하세요
        </p>
      </div>
      <ProjectGrid projects={allProjects} />
      <LoadMoreButton initialCount={allProjects.length} />
    </div>
  );
}
