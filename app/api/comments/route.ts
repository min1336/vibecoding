import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { COMMENT_RATE_LIMIT } from "@/lib/constants";
import { commentCreateSchema, projectIdParamSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  const parsed = projectIdParamSchema.safeParse(projectId);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("project_id", parsed.data)
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

  const body = await request.json();
  const parsed = commentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { project_id, content } = parsed.data;

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
    .insert({ user_id: user.id, project_id, content })
    .select("*, profiles(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: "댓글 작성 실패" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
