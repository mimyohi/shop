"use client";

import { useEffect, useState } from "react";
import { NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY } from "@/env";
import { useOptionalAuthContext } from "@/providers/AuthProvider";
import { supabaseAuth } from "@/lib/supabaseAuth";

interface ChannelTalkProps {
  pluginKey?: string;
}

export default function ChannelTalk({ pluginKey }: ChannelTalkProps) {
  const channelPluginKey = pluginKey || NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY;
  const { user, profile } = useOptionalAuthContext();
  const [purchasedProducts, setPurchasedProducts] = useState<string>("");
  const [lastOrderAt, setLastOrderAt] = useState<string>("");
  const [lastAccessAt, setLastAccessAt] = useState<string>("");

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

    // 사용자 정보가 있으면 로그인 사용자로 boot, 없으면 익명 boot
    const bootSettings: any = {
      pluginKey: channelPluginKey,
    };

    if (user && profile) {
      bootSettings.memberId = user.id;
      bootSettings.profile = {
        name: profile.display_name || "",
        mobileNumber: profile.phone || "",
        purchasedProducts: purchasedProducts,
        lastAccessAt: lastAccessAt,
        lastOrderAt: lastOrderAt || null,
      };
    }

    // updateUser 또는 boot 호출
    if (w.ChannelIO) {
      w.ChannelIO("shutdown");
      w.ChannelIO("boot", bootSettings);
    }

    return () => {
      // cleanup은 하지 않음 - 다른 페이지에서도 채널톡 유지
    };
  }, [channelPluginKey, user?.id, profile?.display_name, profile?.phone, purchasedProducts, lastAccessAt, lastOrderAt]);

  return null;
}
