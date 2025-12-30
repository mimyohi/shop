"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductBannerItem {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  link_target: "_self" | "_blank";
  device_type: "pc" | "mobile" | "both";
  display_order: number;
  is_active: boolean;
}

interface ProductBannerProps {
  banners: ProductBannerItem[];
}

export default function ProductBanner({ banners }: ProductBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeBanners = banners.filter((b) => b.is_active);

  const extendedBanners =
    activeBanners.length > 1
      ? [
          activeBanners[activeBanners.length - 1],
          ...activeBanners,
          activeBanners[0],
        ]
      : activeBanners;

  const realIndex =
    activeBanners.length > 1
      ? (currentSlide - 1 + activeBanners.length) % activeBanners.length
      : 0;

  useEffect(() => {
    if (activeBanners.length <= 1 || !isAutoPlaying) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentSlide((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeBanners.length, isAutoPlaying]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    if (currentSlide === 0) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(activeBanners.length);
      }, 300);
      return () => clearTimeout(timeout);
    }

    if (currentSlide === extendedBanners.length - 1) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(1);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentSlide, activeBanners.length, extendedBanners.length]);

  const goToSlide = (index: number) => {
    setIsTransitioning(true);
    setCurrentSlide(index + 1);
  };

  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev - 1);
  }, []);

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setTranslateX(0);
    setIsAutoPlaying(false);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setTranslateX(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;

    if (translateX > threshold) {
      prevSlide();
    } else if (translateX < -threshold) {
      nextSlide();
    }

    setTranslateX(0);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  if (activeBanners.length === 0) {
    return null;
  }

  // 배너가 1개일 때
  if (activeBanners.length === 1) {
    const banner = activeBanners[0];
    return (
      <section className="pt-[20px] md:pt-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-lg">
            {/* PC: 1380x501 비율 */}
            <div className="hidden md:block relative w-full aspect-[1380/501]">
              {banner.link_url ? (
                <Link href={banner.link_url} target={banner.link_target}>
                  <Image
                    src={banner.image_url}
                    alt="상품 배너"
                    fill
                    className="object-cover"
                  />
                </Link>
              ) : (
                <Image
                  src={banner.image_url}
                  alt="상품 배너"
                  fill
                  className="object-cover"
                />
              )}
            </div>
            {/* 모바일: 378x137 비율 */}
            <div className="md:hidden relative w-full aspect-[378/137]">
              {banner.link_url ? (
                <Link href={banner.link_url} target={banner.link_target}>
                  <Image
                    src={banner.mobile_image_url || banner.image_url}
                    alt="상품 배너"
                    fill
                    className="object-cover"
                  />
                </Link>
              ) : (
                <Image
                  src={banner.mobile_image_url || banner.image_url}
                  alt="상품 배너"
                  fill
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-[20px] md:pt-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex"
            style={{
              transform: `translateX(calc(-${currentSlide * 100}% + ${
                isDragging ? translateX : 0
              }px))`,
              transition:
                isTransitioning && !isDragging
                  ? "transform 300ms ease-out"
                  : "none",
            }}
          >
            {extendedBanners.map((banner, index) => (
              <div key={`${banner.id}-${index}`} className="w-full shrink-0">
                {/* PC: 1380x501 비율 */}
                <div className="hidden md:block relative w-full aspect-[1380/501]">
                  {banner.link_url && !isDragging ? (
                    <Link
                      href={banner.link_url}
                      target={banner.link_target}
                      draggable={false}
                      onClick={(e) => {
                        if (Math.abs(translateX) > 5) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Image
                        src={banner.image_url}
                        alt="상품 배너"
                        fill
                        className="object-cover pointer-events-none"
                        priority={index <= 2}
                        draggable={false}
                      />
                    </Link>
                  ) : (
                    <Image
                      src={banner.image_url}
                      alt="상품 배너"
                      fill
                      className="object-cover pointer-events-none"
                      priority={index <= 2}
                      draggable={false}
                    />
                  )}
                </div>

                {/* 모바일: 378x137 비율 */}
                <div className="md:hidden relative w-full aspect-[378/137]">
                  {banner.link_url && !isDragging ? (
                    <Link
                      href={banner.link_url}
                      target={banner.link_target}
                      draggable={false}
                      onClick={(e) => {
                        if (Math.abs(translateX) > 5) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Image
                        src={banner.mobile_image_url || banner.image_url}
                        alt="상품 배너"
                        fill
                        className="object-cover pointer-events-none"
                        priority={index <= 2}
                        draggable={false}
                      />
                    </Link>
                  ) : (
                    <Image
                      src={banner.mobile_image_url || banner.image_url}
                      alt="상품 배너"
                      fill
                      className="object-cover pointer-events-none"
                      priority={index <= 2}
                      draggable={false}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 좌우 화살표 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 3000);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/50 hover:bg-white/75 rounded-full flex items-center justify-center transition z-10"
            aria-label="이전 배너"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 3000);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/50 hover:bg-white/75 rounded-full flex items-center justify-center transition z-10"
            aria-label="다음 배너"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          {/* 인디케이터 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                  setIsAutoPlaying(false);
                  setTimeout(() => setIsAutoPlaying(true), 3000);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === realIndex
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
