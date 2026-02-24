export type VoiceToneLevel = 1 | 2;

export type VoiceToneOption = {
  value: VoiceToneLevel;
  label: string;
  note: string;
};

export const VOICE_TONE_OPTIONS: readonly VoiceToneOption[] = [
  { value: 1, label: "1단계", note: "부드러운 반존댓말" },
  { value: 2, label: "2단계", note: "더 캐주얼한 반말" },
] as const;

export type VoiceToneFallbackType = "stream" | "chat";

export function getVoiceToneFallbackMessage(
  level: VoiceToneLevel,
  kind: VoiceToneFallbackType,
): string {
  if (kind === "stream") {
    return level === 1
      ? "좋아요, 오늘도 기록해줘서 고마워요. 지금은 감정을 잠깐 가라앉히고 3분만 천천히 호흡해보세요. 💙"
      : "좋았어, 오늘도 기록해줘서 고마워. 지금은 감정 정리해서 3분만 천천히 호흡해보자. 💙";
  }

  return level === 1
    ? "아, 잠깐 연결이 끊겼네. 잠시 뒤에 다시 이어가요."
    : "아, 잠깐 문제가 생겼네. 잠시 뒤에 다시 이어가자.";
}
