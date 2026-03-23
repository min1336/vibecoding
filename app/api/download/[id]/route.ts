import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("file_url, title")
    .eq("id", id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });
  }

  const filePath = project.file_url.split("/storage/v1/object/public/").pop()
    ?? project.file_url.split("/storage/v1/object/sign/").pop()
    ?? project.file_url;

  const bucket = "project-files";
  const objectPath = filePath.startsWith(bucket + "/")
    ? filePath.slice(bucket.length + 1)
    : filePath;

  const { data: signedUrl } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60);

  if (!signedUrl?.signedUrl) {
    return NextResponse.json({ error: "다운로드 링크 생성 실패" }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
