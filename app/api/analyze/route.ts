import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Vercel 함수 최대 실행시간 설정 (Hobby: 최대 60s)
export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const KOREAN_FOOD_PROMPT = `당신은 한국 음식 전문 영양사입니다. 사진에서 음식을 식별하고 영양 정보를 분석해주세요.

분석 지침:
1. 한국 음식(한식)에 특히 정통합니다: 밥, 국/찌개, 반찬, 면 요리, 분식 등
2. 음식의 종류와 대략적인 양(1인분 기준)을 파악하세요
3. 재료와 조리법을 고려하여 영양소를 추정하세요
4. 확실하지 않은 경우 범위로 제시하세요

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "foodName": "음식 이름 (한국어)",
  "description": "음식에 대한 간단한 설명 (1-2문장)",
  "servingSize": "분량 설명 (예: 1인분, 1공기 등)",
  "nutrition": {
    "calories": 숫자 (kcal),
    "protein": 숫자 (g),
    "carbs": 숫자 (g),
    "fat": 숫자 (g),
    "fiber": 숫자 (g),
    "sodium": 숫자 (mg)
  },
  "ingredients": ["주재료1", "주재료2", "주재료3"],
  "healthScore": 1~10 사이 숫자,
  "healthComment": "건강 관련 한마디 (한국어)",
  "confidence": "high" | "medium" | "low"
}`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "서버 설정 오류: API 키가 없습니다." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "이미지가 없습니다." }, { status: 400 });
    }

    // 이미지 크기 제한 (4MB)
    if (imageFile.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "이미지 크기가 너무 큽니다. 4MB 이하의 사진을 사용해주세요." },
        { status: 400 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = imageFile.type as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: KOREAN_FOOD_PROMPT,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("텍스트 응답이 아닙니다.");
    }

    const jsonText = content.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const result = JSON.parse(jsonText);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.constructor.name : "UnknownError";
    console.error("분석 오류:", name, message);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI 응답 파싱 실패. 다시 시도해주세요." },
        { status: 500 }
      );
    }
    // 디버그용: 실제 에러 메시지를 응답에 포함 (원인 파악 후 제거 예정)
    return NextResponse.json(
      { error: `[${name}] ${message}` },
      { status: 500 }
    );
  }
}
