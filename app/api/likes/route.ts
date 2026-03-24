import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { project_id } = await request.json();
  if (!project_id) {
    return NextResponse.json({ error: "project_id가 필요합니다" }, { status: 400 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("project_id", project_id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", project_id);

    if (error) {
      return NextResponse.json({ error: "좋아요 취소 실패" }, { status: 500 });
    }
    return NextResponse.json({ liked: false });
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ user_id: user.id, project_id });

    if (error) {
      return NextResponse.json({ error: "좋아요 실패" }, { status: 500 });
    }
    return NextResponse.json({ liked: true });
  }
}
