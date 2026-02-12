"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Message } from "@/lib/supabase/types";

export async function createVibe(content: string) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 사용자 정보 가져오기
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "사용자 정보를 찾을 수 없습니다." };
    }

    // 입력 검증
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > 20) {
      return { success: false, error: "1-20자 사이로 입력해주세요." };
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 표시 이름 결정
    const userName =
      user.firstName ||
      user.username ||
      user.emailAddresses[0]?.emailAddress ||
      "Anonymous";

    // 메시지 삽입
    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        user_name: userName,
        content: trimmedContent,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: "메시지 전송에 실패했습니다." };
    }

    revalidatePath("/");
    return { success: true, data };
  } catch (error) {
    console.error("createVibe error:", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

export async function deleteVibe(messageId: string) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 먼저 메시지가 존재하는지, 소유자가 맞는지 확인
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("user_id")
      .eq("id", messageId)
      .single();

    if (fetchError || !message) {
      return { success: false, error: "메시지를 찾을 수 없습니다." };
    }

    if (message.user_id !== userId) {
      return { success: false, error: "본인의 메시지만 삭제할 수 있습니다." };
    }

    // 삭제 실행
    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return { success: false, error: "메시지 삭제에 실패했습니다." };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteVibe error:", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

export async function getVibes(): Promise<Message[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("inserted_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase fetch error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("getVibes error:", error);
    return [];
  }
}
