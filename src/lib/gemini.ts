import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Emotion } from "@/lib/supabase/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 빠른 분석 (감정/점수/음악 키워드만 — ai_message 제외)
export type DiaryAnalysis = {
  emotion: Emotion;
  emotion_score: number;
  music_keyword: string;
};

export type PastDiary = {
  content: string;
  emotion: Emotion | null;
  created_at: string;
};

const VALID_EMOTIONS: Emotion[] = [
  "joy", "sadness", "anger", "anxiety", "peace", "excitement", "gratitude",
];

const QUICK_ANALYSIS_PROMPT = `당신은 공감 능력이 뛰어난 AI 상담사입니다.
사용자의 일기를 읽고 감정을 분석해주세요.

반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "emotion": "감정 카테고리 (joy | sadness | anger | anxiety | peace | excitement | gratitude 중 하나)",
  "emotion_score": 0.0~1.0 사이의 감정 강도,
  "music_keyword": "감정에 어울리는 음악 검색 키워드 (영어, 2~3단어)"
}

규칙:
- 감정 카테고리는 반드시 위 7개 중 하나여야 합니다.
- JSON 외의 텍스트를 포함하지 마세요.`;

const MODEL = "gemini-2.5-flash";

export async function analyzeDiary(content: string): Promise<DiaryAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    const result = await model.generateContent([
      { text: QUICK_ANALYSIS_PROMPT },
      { text: `사용자 일기:\n${content}` },
    ]);

    const jsonStr = result.response
      .text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(jsonStr) as DiaryAnalysis;

    if (!VALID_EMOTIONS.includes(parsed.emotion)) {
      parsed.emotion = "peace";
    }
    parsed.emotion_score = Math.min(1, Math.max(0, Number(parsed.emotion_score) || 0.5));

    return parsed;
  } catch (err) {
    console.error("analyzeDiary error:", err);
    return { emotion: "peace", emotion_score: 0.5, music_keyword: "calm ambient piano" };
  }
}

function buildPastContext(pastDiaries: PastDiary[]): string {
  if (!pastDiaries.length) return "";
  const lines = pastDiaries.map((d) => {
    const date = new Date(d.created_at).toLocaleDateString("ko-KR");
    return `- ${date} [${d.emotion ?? "?"}]: ${d.content.slice(0, 80)}`;
  });
  return `\n\n최근 일기 기록 (맥락 참고용):\n${lines.join("\n")}`;
}

// 스트리밍 AI 위로 메시지 (과거 일기 컨텍스트 포함)
export async function* streamAiMessage(
  content: string,
  emotion: Emotion | null,
  pastDiaries: PastDiary[],
): AsyncGenerator<string> {
  const model = genAI.getGenerativeModel({ model: MODEL });

  const systemPrompt = `당신은 공감 능력이 뛰어난 AI 상담사입니다.
사용자의 일기를 읽고 따뜻하고 진심 어린 위로/응원 메시지를 작성해주세요.
2~3문장으로, 공감적이고 따뜻한 톤으로, 사용자의 구체적인 상황에 맞춰 한국어로 작성하세요.
메시지만 출력하고 다른 설명은 포함하지 마세요.${buildPastContext(pastDiaries)}`;

  const result = await model.generateContentStream([
    { text: systemPrompt },
    { text: `사용자 일기 (감정: ${emotion ?? "알 수 없음"}):\n${content}` },
  ]);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

// 멀티턴 채팅 스트리밍
export async function* streamChatReply(
  diaryContent: string,
  emotion: Emotion | null,
  firstAiMessage: string,
  pastDiaries: PastDiary[],
  messages: Array<{ role: "user" | "ai"; content: string }>,
): AsyncGenerator<string> {
  const model = genAI.getGenerativeModel({ model: MODEL });

  const systemContext = `당신은 공감 능력이 뛰어난 AI 상담사입니다.
사용자의 일기를 바탕으로 대화를 이어가고 있습니다.

일기 내용 (감정: ${emotion ?? "알 수 없음"}):
${diaryContent}${buildPastContext(pastDiaries)}

짧고 공감적인 답변을 한국어로 작성하세요. 2~3문장이면 충분합니다.`;

  const history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [
    { role: "user", parts: [{ text: systemContext }] },
    { role: "model", parts: [{ text: firstAiMessage }] },
    ...messages.slice(0, -1).map((m) => ({
      role: (m.role === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: m.content }],
    })),
  ];

  const lastMessage = messages[messages.length - 1]?.content;
  if (!lastMessage) return;

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
