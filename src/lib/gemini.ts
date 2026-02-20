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

export type EmotionInsightResult = {
  summary: string;
  patterns: string[];
  triggers: string[];
  recommendations: string[];
};

export type ActionPlanStep = {
  title: string;
  description: string;
  durationMinutes: number;
};

export type ActionPlanResult = {
  title: string;
  steps: ActionPlanStep[];
  checkInQuestion: string;
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
  "music_keyword": "유튜브 오피셜 MV 검색용 키워드 (영어, '아티스트명 + 곡명' 형태, 2~6단어)"
}

규칙:
- 감정 카테고리는 반드시 위 7개 중 하나여야 합니다.
- music_keyword는 장르/분위기 단어보다, 실제 아티스트와 곡명을 우선하세요.
- music_keyword 예시: "IU Through the Night", "Coldplay Fix You", "Adele Hello"
- JSON 외의 텍스트를 포함하지 마세요.`;

const MODEL = "gemini-2.5-flash";

function extractJson(text: string): string {
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

export async function analyzeDiary(content: string): Promise<DiaryAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });

    const result = await model.generateContent([
      { text: QUICK_ANALYSIS_PROMPT },
      { text: `사용자 일기:\n${content}` },
    ]);

    const jsonStr = extractJson(result.response.text());

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

function normalizeList(input: unknown, min = 2, max = 5): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, max)
    .concat(Array.from({ length: min }, () => "").slice(0, Math.max(0, min - input.length)))
    .filter(Boolean);
}

export async function generateEmotionInsights(params: {
  rangeDays: number;
  diaries: PastDiary[];
  byEmotion: Record<string, number>;
}): Promise<EmotionInsightResult> {
  const fallback: EmotionInsightResult = {
    summary: "최근 기록을 기반으로 감정 변화를 추적 중입니다. 조금씩 패턴이 보이고 있어요.",
    patterns: ["감정의 강도가 요일/상황에 따라 달라질 수 있어요."],
    triggers: ["피로 누적, 수면 부족, 대인 스트레스 여부를 함께 기록해보세요."],
    recommendations: [
      "하루 1회 5분 감정 기록을 유지해보세요.",
      "감정이 높아지는 시간대에 짧은 휴식 루틴을 넣어보세요.",
    ],
  };

  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const diaryLines = params.diaries
      .slice(0, 40)
      .map((d) => `- ${d.created_at} [${d.emotion ?? "unknown"}]: ${d.content.slice(0, 120)}`)
      .join("\n");

    const prompt = `너는 감정 패턴 분석가다. 다음 데이터를 분석해 사용자에게 실용적인 인사이트를 제공해라.

기간: 최근 ${params.rangeDays}일
감정 분포(JSON): ${JSON.stringify(params.byEmotion)}
일기 샘플:
${diaryLines || "- (데이터 없음)"}

반드시 JSON으로만 답해라:
{
  "summary": "2~3문장 요약",
  "patterns": ["반복 패턴 2~4개"],
  "triggers": ["감정 트리거 가설 2~4개"],
  "recommendations": ["실행 가능한 제안 2~4개"]
}`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(extractJson(result.response.text())) as Partial<EmotionInsightResult>;

    const summary = typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : fallback.summary;
    const patterns = normalizeList(parsed.patterns, 1, 4);
    const triggers = normalizeList(parsed.triggers, 1, 4);
    const recommendations = normalizeList(parsed.recommendations, 2, 4);

    return {
      summary,
      patterns: patterns.length ? patterns : fallback.patterns,
      triggers: triggers.length ? triggers : fallback.triggers,
      recommendations: recommendations.length ? recommendations : fallback.recommendations,
    };
  } catch (error) {
    console.error("generateEmotionInsights error:", error);
    return fallback;
  }
}

export async function generateActionPlan(params: {
  diaryContent: string;
  emotion: Emotion | null;
  pastDiaries: PastDiary[];
}): Promise<ActionPlanResult> {
  const fallback: ActionPlanResult = {
    title: "오늘의 회복 루틴",
    steps: [
      {
        title: "호흡 정리",
        description: "4초 들숨, 4초 멈춤, 6초 날숨을 3분 반복하세요.",
        durationMinutes: 3,
      },
      {
        title: "감정 분리 기록",
        description: "사실/해석/감정을 3줄로 나눠 간단히 적어보세요.",
        durationMinutes: 7,
      },
      {
        title: "작은 행동 1개 실행",
        description: "지금 가능한 아주 작은 할 일 1개를 정해 바로 실행하세요.",
        durationMinutes: 10,
      },
    ],
    checkInQuestion: "이 루틴 후 내 감정 강도는 10점 만점에 몇 점인가요?",
  };

  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const pastContext = params.pastDiaries
      .slice(0, 5)
      .map((d) => `- ${d.created_at} [${d.emotion ?? "unknown"}]: ${d.content.slice(0, 80)}`)
      .join("\n");

    const prompt = `너는 감정 코치다. 사용자 일기를 기반으로 오늘 당장 실행 가능한 3단계 액션플랜을 만들어라.

현재 일기(감정: ${params.emotion ?? "unknown"}):
${params.diaryContent}

최근 맥락:
${pastContext || "- (없음)"}

반드시 JSON으로만 답해라:
{
  "title": "플랜 제목",
  "steps": [
    { "title": "단계명", "description": "구체 행동", "durationMinutes": 5 }
  ],
  "checkInQuestion": "마무리 셀프 체크 질문 1개"
}

제약:
- steps는 정확히 3개
- 각 step은 3~15분 사이 durationMinutes
- 위로 문구보다 실행 행동 중심`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(extractJson(result.response.text())) as Partial<ActionPlanResult>;

    const steps = Array.isArray(parsed.steps)
      ? parsed.steps
          .map((step) => {
            const s = step as Partial<ActionPlanStep>;
            if (
              typeof s.title !== "string" ||
              typeof s.description !== "string"
            ) {
              return null;
            }
            const duration = Number(s.durationMinutes);
            return {
              title: s.title.trim(),
              description: s.description.trim(),
              durationMinutes: Math.min(15, Math.max(3, Number.isFinite(duration) ? duration : 5)),
            } satisfies ActionPlanStep;
          })
          .filter((step): step is ActionPlanStep => Boolean(step))
          .slice(0, 3)
      : [];

    if (steps.length !== 3) return fallback;

    return {
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : fallback.title,
      steps,
      checkInQuestion:
        typeof parsed.checkInQuestion === "string" && parsed.checkInQuestion.trim()
          ? parsed.checkInQuestion.trim()
          : fallback.checkInQuestion,
    };
  } catch (error) {
    console.error("generateActionPlan error:", error);
    return fallback;
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

  const systemPrompt = `당신은 10년 경력의 임상심리사입니다. 사용자의 일기를 읽고 심리적으로 깊이 있는 피드백을 제공합니다.

다음 원칙에 따라 응답하세요:
- 사용자의 감정을 먼저 구체적으로 인정하고 공감합니다
- 그 감정이 갖는 심리적 의미나 맥락에 대한 통찰을 제공합니다
- 자기이해나 성장을 돕는 질문 또는 제안으로 마무리합니다
- 3~4문장, 전문적이되 따뜻하고 친근한 한국어로 작성합니다
- 메시지만 출력하고 다른 설명은 포함하지 마세요${buildPastContext(pastDiaries)}`;

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

  const systemContext = `당신은 10년 경력의 임상심리사입니다. 사용자의 일기를 바탕으로 상담 대화를 이어가고 있습니다.

일기 내용 (감정: ${emotion ?? "알 수 없음"}):
${diaryContent}${buildPastContext(pastDiaries)}

대화 원칙:
- 사용자의 이야기를 경청하고 심리적으로 공감합니다
- 필요할 때 통찰이나 새로운 관점을 제시합니다
- 자기탐색을 돕는 질문을 자연스럽게 사용합니다
- 2~3문장, 전문적이되 따뜻한 한국어로 작성합니다`;

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
