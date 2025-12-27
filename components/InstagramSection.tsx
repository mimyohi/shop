"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
  instagramHandle = "mimyohi.official",
}: InstagramSectionProps) {
  const [isPaused, setIsPaused] = useState(false);

  if (images.length === 0) {
    return null;
  }

  // 무한 스크롤을 위해 이미지 복제
  const duplicatedImages = images.length > 1 ? [...images, ...images] : images;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <Link
            href={`https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl md:text-2xl font-light text-[#75C7C7] hover:text-[#75C7C7] transition-colors"
          >
            Follow @{instagramHandle}
          </Link>
        </div>

        {/* 무한 스크롤 캐러셀 */}
        <div
          className="overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={`flex gap-4 px-4 sm:px-6 lg:px-8 ${
              images.length === 1 ? "justify-center" : ""
            }`}
            style={{
              animation: images.length > 1 ? "scroll 30s linear infinite" : "none",
              animationPlayState: isPaused ? "paused" : "running",
              width: images.length > 1 ? "fit-content" : "auto",
            }}
          >
            {duplicatedImages.map((image, index) => (
              <Link
                key={`${image.id}-${index}`}
                href={
                  image.link_url || `https://instagram.com/${instagramHandle}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="relative shrink-0 w-[200px] md:w-[280px] aspect-square overflow-hidden group"
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
        </div>
      </div>

      {/* 무한 스크롤 애니메이션 */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
