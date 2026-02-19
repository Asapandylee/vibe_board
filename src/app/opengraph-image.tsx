import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Bad Day — 나쁜 하루도 괜찮아";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#09090b",
        fontFamily: "sans-serif",
        gap: 24,
        padding: "60px 80px",
      }}
    >
      {/* 비 구름 이모지 */}
      <div style={{ fontSize: 120, lineHeight: 1 }}>🌧️</div>

      {/* 타이틀 */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-2px",
          lineHeight: 1,
        }}
      >
        Bad Day
      </div>

      {/* 서브타이틀 */}
      <div
        style={{
          fontSize: 36,
          color: "#a1a1aa",
          fontWeight: 500,
          letterSpacing: "-0.5px",
        }}
      >
        나쁜 하루도 괜찮아
      </div>

      {/* 설명 */}
      <div
        style={{
          fontSize: 22,
          color: "#71717a",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 700,
        }}
      >
        일기를 쓰면 AI가 감정을 분석하고, 어울리는 음악과 따뜻한 메시지를
        전해드려요
      </div>

      {/* 배지 */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 8,
        }}
      >
        {["🧠 AI 감정 분석", "🎵 음악 추천", "💬 위로 메시지"].map((badge) => (
          <div
            key={badge}
            style={{
              padding: "10px 22px",
              backgroundColor: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: 9999,
              color: "#d4d4d8",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            {badge}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
