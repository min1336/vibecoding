import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import { GalleryClient } from "./gallery-client";

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tool?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const sort = params.sort || "new";
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("*, profiles(*)");

  // Filters
  if (params.tool) query = query.eq("tool_used", params.tool);
  if (params.category) query = query.eq("category", params.category);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  // Sort
  if (sort === "popular") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", sevenDaysAgo).order("likes_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: projects } = await query.range(0, PAGE_SIZE - 1);

  return <GalleryClient initialProjects={projects ?? []} initialSort={sort} />;
}
