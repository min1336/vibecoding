import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectGrid } from "@/components/gallery/project-grid";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, profiles(*)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url || undefined} alt="" />
          <AvatarFallback className="text-lg">{profile.display_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          {profile.bio && <p className="text-muted-foreground text-sm mt-1">{profile.bio}</p>}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Projects ({projects?.length ?? 0})</h2>
      <ProjectGrid projects={projects ?? []} />
    </div>
  );
}
