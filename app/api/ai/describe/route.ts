import { streamText } from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().min(1).max(100),
  tool: z.string().optional(),
  category: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { title, tool, category } = parsed.data;

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: `당신은 바이브코딩 프로젝트 갤러리의 설명 작성 도우미입니다.
사용자가 프로젝트 제목, 사용 도구, 카테고리를 제공하면 짧고 매력적인 한국어 프로젝트 설명을 작성해주세요.
규칙:
- 2~3문장으로 간결하게
- 프로젝트의 핵심 특징과 기술적 포인트를 포함
- 다른 개발자가 관심을 가질 수 있는 내용으로
- 이모지 사용하지 않기
- 마크다운 사용하지 않기`,
    prompt: `프로젝트 제목: ${title}${tool ? `\n사용 도구: ${tool}` : ""}${category ? `\n카테고리: ${category}` : ""}`,
    maxOutputTokens: 200,
  });

  return result.toTextStreamResponse();
}
