import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { project_id } = await request.json();
  if (!project_id) {
    return NextResponse.json({ error: "project_id가 필요합니다" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_view", { p_project_id: project_id });

  if (error) {
    console.error("View increment failed:", error);
  }

  return NextResponse.json({ success: true });
}
