"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface InstagramImage {
  id: string;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  username?: string;
}

interface InstagramSectionProps {
  images: InstagramImage[];
  instagramHandle?: string;
}

export default function InstagramSection({
  images,
  instagramHandle = "mimyohi.official"
}: InstagramSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <Link
          href={`https://instagram.com/${instagramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl md:text-2xl text-[#5a9a9a] hover:text-[#4a8a8a] transition-colors"
        >
          Follow @{instagramHandle}
        </Link>
      </div>

      {/* 가로 스크롤 캐러셀 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((image) => (
          <Link
            key={image.id}
            href={image.link_url || `https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex-shrink-0 w-[200px] md:w-[280px] aspect-[4/5] overflow-hidden group"
          >
            <Image
              src={image.image_url}
              alt="Instagram"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 200px, 280px"
            />
            {/* 호버 오버레이 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

            {/* 하단 유저네임 */}
            {image.username && (
              <div className="absolute bottom-3 right-3">
                <span className="text-xs text-white/80 bg-black/30 px-2 py-1 rounded">
                  @{image.username}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* 스크롤바 숨기기 스타일 */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
