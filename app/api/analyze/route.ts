import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const KOREAN_FOOD_PROMPT = `당신은 한국 음식 전문 영양사입니다. 사진에 있는 모든 음식을 찾아서 각각 영양 정보를 분석해주세요.

분석 지침:
1. 사진에 보이는 모든 음식/반찬을 빠짐없이 각각 분리하여 분석하세요
   - 예: 밥 + 김치찌개 + 김치 + 시금치나물 → 4개 항목으로 분석
2. 밥, 국/찌개, 반찬, 음료 등 모두 별도 항목으로 처리하세요
3. 음식의 종류와 대략적인 양(1인분 기준)을 파악하세요
4. 재료와 조리법을 고려하여 영양소를 추정하세요

반드시 아래 JSON 배열 형식으로만 응답하세요 (다른 텍스트 없이):
[
  {
    "foodName": "음식 이름 (한국어)",
    "description": "음식에 대한 간단한 설명 (1문장)",
    "servingSize": "분량 설명 (예: 1공기, 1인분 등)",
    "nutrition": {
      "calories": 숫자 (kcal),
      "protein": 숫자 (g),
      "carbs": 숫자 (g),
      "fat": 숫자 (g),
      "fiber": 숫자 (g),
      "sodium": 숫자 (mg)
    },
    "ingredients": ["주재료1", "주재료2"],
    "healthScore": 1~10 사이 숫자,
    "healthComment": "건강 관련 한마디 (한국어)",
    "confidence": "high" | "medium" | "low"
  }
]
음식이 1개여도 반드시 배열로 응답하세요.`;

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
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: KOREAN_FOOD_PROMPT },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("텍스트 응답이 아닙니다.");

    const jsonText = content.text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const result = JSON.parse(jsonText);

    // 배열이 아니면 배열로 감싸기 (하위 호환)
    const items = Array.isArray(result) ? result : [result];
    return NextResponse.json(items);
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
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
