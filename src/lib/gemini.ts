import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Emotion } from "@/lib/supabase/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type DiaryAnalysis = {
  emotion: Emotion;
  emotion_score: number;
  ai_message: string;
  music_keyword: string;
};

const SYSTEM_PROMPT = `당신은 공감 능력이 뛰어난 AI 상담사입니다.
사용자의 일기를 읽고 감정을 분석해주세요.

반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "emotion": "감정 카테고리 (joy | sadness | anger | anxiety | peace | excitement | gratitude 중 하나)",
  "emotion_score": 0.0~1.0 사이의 감정 강도,
  "ai_message": "따뜻하고 진심 어린 위로/응원 메시지 (2~3문장, 한국어)",
  "music_keyword": "감정에 어울리는 음악 검색 키워드 (영어, 2~3단어)"
}

규칙:
- 감정 카테고리는 반드시 위 7개 중 하나여야 합니다.
- ai_message는 공감적이고 따뜻한 톤으로, 사용자의 구체적인 상황에 맞춰 작성하세요.
- music_keyword는 해당 감정에 어울리는 배경음악을 찾기 위한 키워드입니다.
- JSON 외의 텍스트를 포함하지 마세요.`;

export async function analyzeDiary(content: string): Promise<DiaryAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: `사용자 일기:\n${content}` },
    ]);

    const response = result.response;
    const text = response.text();

    // JSON 파싱 (마크다운 코드블록 제거)
    const jsonStr = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(jsonStr) as DiaryAnalysis;

    // 유효성 검증
    const validEmotions: Emotion[] = [
      "joy",
      "sadness",
      "anger",
      "anxiety",
      "peace",
      "excitement",
      "gratitude",
    ];

    if (!validEmotions.includes(parsed.emotion)) {
      parsed.emotion = "peace";
    }

    parsed.emotion_score = Math.min(
      1,
      Math.max(0, Number(parsed.emotion_score) || 0.5),
    );

    return parsed;
  } catch (error) {
    console.error("Gemini API error:", error);

    // 폴백 응답
    return {
      emotion: "peace",
      emotion_score: 0.5,
      ai_message:
        "오늘 하루도 수고했어요. 일기를 쓰는 것만으로도 대단한 거예요. 내일은 더 좋은 하루가 될 거예요. 🌤️",
      music_keyword: "calm ambient piano",
    };
  }
}
