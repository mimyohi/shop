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

    // 채널톡 부트 함수
    const boot = () => {
      (window as any).ChannelIO("boot", {
        pluginKey: channelPluginKey,
        // 사용자 정보를 전달하려면 아래 주석을 해제하고 수정하세요
        // memberId: 'USER_ID',
        // profile: {
        //   name: 'USER_NAME',
        //   email: 'USER_EMAIL',
        //   mobileNumber: 'USER_PHONE',
        // },
      });
    };

    // 채널톡 스크립트 로드
    (function () {
      const w = window as any;
      if (w.ChannelIO) {
        return w.console.error("ChannelIO script included twice.");
      }
      const ch: any = function () {
        ch.c(arguments);
      };
      ch.q = [];
      ch.c = function (args: any) {
        ch.q.push(args);
      };
      w.ChannelIO = ch;
      function l() {
        if (w.ChannelIOInitialized) {
          return;
        }
        w.ChannelIOInitialized = true;
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
        const x = document.getElementsByTagName("script")[0];
        if (x.parentNode) {
          x.parentNode.insertBefore(s, x);
        }
      }
      if (document.readyState === "complete") {
        l();
      } else {
        w.addEventListener("DOMContentLoaded", l);
        w.addEventListener("load", l);
      }
    })();

    // 스크립트 로드 후 부트
    const checkInterval = setInterval(() => {
      if ((window as any).ChannelIO) {
        clearInterval(checkInterval);
        boot();
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
    };
  }, [channelPluginKey]);

  return null;
}
