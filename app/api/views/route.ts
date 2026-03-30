import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { viewIncrementSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = viewIncrementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_view", { p_project_id: parsed.data.project_id });

  if (error) {
    console.error("View increment failed:", error);
  }

  return NextResponse.json({ success: true });
}
