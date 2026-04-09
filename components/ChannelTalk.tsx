"use client";

import { useEffect, useState, useRef } from "react";
import { NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY } from "@/env";
import { useOptionalAuthContext } from "@/providers/AuthProvider";
import { supabaseAuth } from "@/lib/supabaseAuth";

interface ChannelTalkProps {
  pluginKey?: string;
  memberHash?: string | null; // 서버에서 생성한 HMAC-SHA256(userId, secret)
}

export default function ChannelTalk({ pluginKey, memberHash: initialMemberHash }: ChannelTalkProps) {
  const channelPluginKey = pluginKey || NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY;
  const { user, profile } = useOptionalAuthContext();
  const [purchasedProducts, setPurchasedProducts] = useState<string>("");
  const [lastOrderAt, setLastOrderAt] = useState<string>("");
  const [lastAccessAt, setLastAccessAt] = useState<string>("");
  const [memberHash, setMemberHash] = useState<string | null>(initialMemberHash ?? null);
  const isBootedRef = useRef(false);
  const isBootingRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const currentMemberHashRef = useRef<string | null>(initialMemberHash ?? null);
  // 401 에러가 난 hash는 재시도하지 않음
  const failedMemberHashRef = useRef<string | null>(null);

  // client-side 로그인 시 memberHash 동적 fetch
  useEffect(() => {
    if (!user?.id) {
      setMemberHash(null);
      return;
    }
    if (memberHash) return;

    fetch("/api/channel-talk/member-hash")
      .then((res) => res.json())
      .then((data) => {
        if (data.hash) setMemberHash(data.hash);
      })
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

        if (data && data.length > 0) {
          setLastOrderAt(data[0].created_at);
        } else {
          setLastOrderAt("");
        }

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

    if (!w.ChannelIO) return;

    const currentUserId = user?.id || "anonymous";
    const userChanged =
      currentUserIdRef.current !== null && currentUserIdRef.current !== currentUserId;
    const memberHashChanged = currentMemberHashRef.current !== memberHash;
    const needsReboot =
      !isBootedRef.current ||
      userChanged ||
      (user?.id && memberHashChanged && !!memberHash && memberHash !== failedMemberHashRef.current);

    if (needsReboot) {
      // 이미 boot된 상태에서 유저/hash가 바뀌면 shutdown 먼저
      if (isBootedRef.current && (userChanged || memberHashChanged)) {
        w.ChannelIO("shutdown");
        isBootedRef.current = false;
        isBootingRef.current = false;
      }

      const userProfile = user
        ? {
            name: profile?.display_name || "",
            mobileNumber: profile?.phone || "",
            email: user.email || profile?.email || "",
            purchasedProducts,
            lastAccessAt,
            lastOrderAt: lastOrderAt || null,
          }
        : undefined;

      // 이전에 401 실패한 hash는 사용하지 않음
      const safeHash = memberHash && memberHash !== failedMemberHashRef.current ? memberHash : null;

      const bootSettings: any = { pluginKey: channelPluginKey };
      if (user && safeHash) {
        bootSettings.memberId = user.id;
        bootSettings.memberHash = safeHash;
      }
      if (user && userProfile) {
        bootSettings.profile = userProfile;
      }

      isBootedRef.current = true;
      isBootingRef.current = true;
      currentUserIdRef.current = currentUserId;
      currentMemberHashRef.current = memberHash;

      w.ChannelIO("boot", bootSettings, (error: any) => {
        isBootingRef.current = false;
        if (error) {
          console.error("Channel Talk boot error:", error);
          isBootedRef.current = false;
          currentUserIdRef.current = null;

          // memberId로 boot 실패 시 → 해당 hash 실패로 기록 후 익명으로 재시도
          if (bootSettings.memberId) {
            failedMemberHashRef.current = safeHash;
            const fallbackSettings: any = { pluginKey: channelPluginKey };
            if (user && userProfile) fallbackSettings.profile = userProfile;

            isBootedRef.current = true;
            isBootingRef.current = true;
            currentUserIdRef.current = currentUserId;

            w.ChannelIO("boot", fallbackSettings, (err2: any) => {
              isBootingRef.current = false;
              if (!err2) {
                w.ChannelIO("showChannelButton");
              }
            });
          }
        } else {
          w.ChannelIO("showChannelButton");
        }
      });
    } else if (user && !isBootingRef.current) {
      w.ChannelIO("updateUser", {
        profile: {
          name: profile?.display_name || "",
          mobileNumber: profile?.phone || "",
          email: user.email || profile?.email || "",
          purchasedProducts,
          lastAccessAt,
          lastOrderAt: lastOrderAt || null,
        },
      });
    }
  }, [channelPluginKey, user?.id, user?.email, profile?.display_name, profile?.phone, memberHash, purchasedProducts, lastOrderAt, lastAccessAt]);

  return null;
}
