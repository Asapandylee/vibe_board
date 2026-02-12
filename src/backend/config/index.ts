import { z } from "zod";
import type { AppConfig } from "@/backend/hono/context";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    // Vercel 빌드 단계(Static Generation 등)에서 환경 변수가 없어 빌드가 중단되는 것을 방지합니다.
    const isBuildPhase =
      process.env.VERCEL === "1" || process.env.CI === "true";
    if (isBuildPhase) {
      console.warn(
        "⚠️ Missing Supabase environment variables during build. Using placeholders.",
      );
      return {
        supabase: {
          url: process.env.SUPABASE_URL || "https://placeholder.supabase.co",
          serviceRoleKey:
            process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
        },
      };
    }

    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "config"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid backend configuration: ${messages}`);
  }

  cachedConfig = {
    supabase: {
      url: parsed.data.SUPABASE_URL,
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
