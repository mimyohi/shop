import type { Metadata } from "next";
import { Noto_Sans_KR, Montserrat } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import ChannelTalk from "@/components/ChannelTalk";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Shop - 온라인 쇼핑몰",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} ${montserrat.variable} font-sans`}
      >
        <NuqsAdapter>
          <ReactQueryProvider>
            {children}
            <ChannelTalk />
          </ReactQueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
