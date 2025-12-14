import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import ChannelTalk from "@/components/ChannelTalk";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

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
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className={`${montserrat.variable}`}>
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
