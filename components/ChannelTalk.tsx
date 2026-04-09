"use client";

import { useEffect, useState, useRef } from "react";
import { NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY } from "@/env";
import { useOptionalAuthContext } from "@/providers/AuthProvider";
import { supabaseAuth } from "@/lib/supabaseAuth";

interface ChannelTalkProps {
  pluginKey?: string;
  memberHash?: string | null; // 서버에서 생성한 HMAC-SHA256(userId, secret)
}

export default function ChannelTalk({ pluginKey, memberHash }: ChannelTalkProps) {
  const channelPluginKey = pluginKey || NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY;
  const { user, profile } = useOptionalAuthContext();
  const [purchasedProducts, setPurchasedProducts] = useState<string>("");
  const [lastOrderAt, setLastOrderAt] = useState<string>("");
  const [lastAccessAt, setLastAccessAt] = useState<string>("");
  const isBootedRef = useRef(false);
  const isBootingRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // 최근 접속시간 업데이트
  useEffect(() => {
    if (user?.id) {
      setLastAccessAt(new Date().toISOString());
    } else {
      setLastAccessAt("");
    }
  }, [user?.id]);

  // 구매한 상품 목록 및 최근 주문시간 조회
  useEffect(() => {
    async function fetchOrderData() {
      if (!user?.id) {
        setPurchasedProducts("");
        setLastOrderAt("");
        return;
      }

      try {
        const { data, error } = await supabaseAuth
          .from("orders")
          .select(
            `
            created_at,
            order_items (
              product_name
            )
          `
          )
          .eq("user_id", user.id)
          .in("status", ["paid", "preparing", "shipping", "delivered", "completed"])
          .order("created_at", { ascending: false });

        if (error) {
          console.error("주문 정보 조회 오류:", error);
          return;
        }

        // 최근 주문시간 설정
        if (data && data.length > 0) {
          setLastOrderAt(data[0].created_at);
        } else {
          setLastOrderAt("");
        }

        // 모든 주문에서 상품명 추출 및 중복 제거
        const productNames = new Set<string>();
        data?.forEach((order: any) => {
          order.order_items?.forEach((item: any) => {
            if (item.product_name) {
              productNames.add(item.product_name);
            }
          });
        });

        setPurchasedProducts(Array.from(productNames).join(", "));
      } catch (error) {
        console.error("주문 정보 조회 오류:", error);
      }
    }

    fetchOrderData();
  }, [user?.id]);

  useEffect(() => {
    if (!channelPluginKey) {
      console.warn("채널톡 플러그인 키가 설정되지 않았습니다.");
      return;
    }

    const w = window as any;

    // 채널톡 placeholder 함수 설정
    if (!w.ChannelIO) {
      const ch: any = function () {
        ch.c(arguments);
      };
      ch.q = [];
      ch.c = function (args: any) {
        ch.q.push(args);
      };
      w.ChannelIO = ch;
    }

    // 채널톡 스크립트 로드
    if (!w.ChannelIOInitialized) {
      w.ChannelIOInitialized = true;
      const s = document.createElement("script");
      s.type = "text/javascript";
      s.async = true;
      s.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
      document.head.appendChild(s);
    }

    // 사용자 정보 설정 (user가 있으면 profile 유무와 관계없이 생성)
    const userProfile = user ? {
      name: profile?.display_name || "",
      mobileNumber: profile?.phone || "",
      email: user.email || profile?.email || "",
      purchasedProducts: purchasedProducts,
      lastAccessAt: lastAccessAt,
      lastOrderAt: lastOrderAt || null,
    } : undefined;

    // 채널톡이 준비되지 않았으면 대기
    if (!w.ChannelIO) return;

    // 현재 사용자 ID (로그인 사용자가 있으면 ID, 없으면 "anonymous")
    const currentUserId = user?.id || "anonymous";

    // 사용자가 변경되었는지 확인
    const userChanged = currentUserIdRef.current !== currentUserId;

    // 처음 boot하거나 사용자가 변경된 경우
    if (!isBootedRef.current || userChanged) {
      const bootSettings: any = {
        pluginKey: channelPluginKey,
      };

      // memberHash가 있을 때만 memberId 설정
      // (Identity Verification이 활성화된 경우 hash 없이 memberId 보내면 401 → 버튼 사라짐)
      if (user && memberHash) {
        bootSettings.memberId = user.id;
        bootSettings.memberHash = memberHash;
      }
      // hash 없이도 profile은 항상 전달 (이름/전화번호/이메일이 상담창에 표시됨)
      if (user && userProfile) {
        bootSettings.profile = userProfile;
      }

      // boot 호출 전에 상태 업데이트 (재호출 방지)
      isBootedRef.current = true;
      isBootingRef.current = true;
      currentUserIdRef.current = currentUserId;

      w.ChannelIO("boot", bootSettings, (error: any) => {
        isBootingRef.current = false;
        if (error) {
          console.error("Channel Talk boot error:", error);
          // 에러 발생 시 상태 초기화
          isBootedRef.current = false;
          currentUserIdRef.current = null;
        } else {
          // boot 완료 후 채널 버튼 표시 보장
          w.ChannelIO("showChannelButton");
        }
      });
    }
    // boot 진행 중이 아닐 때만 프로필 업데이트 (boot 중 updateUser 호출 시 버튼이 사라지는 버그 방지)
    else if (user && userProfile && !isBootingRef.current) {
      w.ChannelIO("updateUser", {
        profile: userProfile,
      });
    }

    return () => {
      // cleanup은 하지 않음 - 다른 페이지에서도 채널톡 유지
    };
  }, [channelPluginKey, user?.id, user?.email, profile?.display_name, profile?.phone, purchasedProducts, lastOrderAt, lastAccessAt]);

  return null;
}
