import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MAX_COMMENT_LENGTH, COMMENT_RATE_LIMIT } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json({ error: "project_id가 필요합니다" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "댓글 조회 실패" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { project_id, content } = await request.json();

  if (!project_id || !content?.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요" }, { status: 400 });
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `댓글은 ${MAX_COMMENT_LENGTH}자 이내로 입력해주세요` },
      { status: 400 }
    );
  }

  // Rate limit check
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneMinuteAgo);

  if ((count ?? 0) >= COMMENT_RATE_LIMIT) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요" }, { status: 429 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ user_id: user.id, project_id, content: content.trim() })
    .select("*, profiles(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: "댓글 작성 실패" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
