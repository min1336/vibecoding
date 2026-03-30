import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const revalidate = 60;

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <DashboardClient
      initialProjects={projects ?? []}
      isAuthenticated={!!user}
    />
  );
}
