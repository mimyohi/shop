"use client";

import { useEffect } from "react";
import { NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY } from "@/env";

interface ChannelTalkProps {
  pluginKey?: string;
}

export default function ChannelTalk({ pluginKey }: ChannelTalkProps) {
  const channelPluginKey =
    pluginKey || NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY;

  useEffect(() => {
    if (!channelPluginKey) {
      console.warn("채널톡 플러그인 키가 설정되지 않았습니다.");
      return;
    }

    const w = window as any;

    // 이미 초기화된 경우 중복 실행 방지
    if (w.ChannelIOInitialized) {
      return;
    }

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
    w.ChannelIOInitialized = true;
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
    s.onload = () => {
      w.ChannelIO("boot", {
        pluginKey: channelPluginKey,
      });
    };
    document.head.appendChild(s);

    return () => {
      if (w.ChannelIO) {
        w.ChannelIO("shutdown");
      }
    };
  }, [channelPluginKey]);

  return null;
}
