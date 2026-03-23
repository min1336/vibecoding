import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });
  }

  if (project.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const storagePath = `${user.id}/${id}`;

  // Storage 먼저 삭제 → DB 삭제 (고아 파일 방지)
  const buckets = ["screenshots", "project-files", "previews"];
  for (const bucket of buckets) {
    const { data: files } = await admin.storage.from(bucket).list(storagePath);
    if (files && files.length > 0) {
      const filePaths = files.map((f) => `${storagePath}/${f.name}`);
      await admin.storage.from(bucket).remove(filePaths);
    }
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
