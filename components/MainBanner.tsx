'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface MainBanner {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  device_type: 'pc' | 'mobile' | 'both';
  display_order: number;
  is_active: boolean;
}

interface MainBannerProps {
  banners: MainBanner[];
}

export default function MainBanner({ banners }: MainBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(1); // 클론 때문에 1부터 시작
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // 활성화된 배너만 필터링
  const activeBanners = banners.filter(b => b.is_active);

  // 무한 루프를 위해 앞뒤에 클론 추가: [마지막] + [원본들] + [첫번째]
  const extendedBanners = activeBanners.length > 1
    ? [activeBanners[activeBanners.length - 1], ...activeBanners, activeBanners[0]]
    : activeBanners;

  // 실제 인덱스 (0 ~ activeBanners.length - 1)
  const realIndex = activeBanners.length > 1
    ? (currentSlide - 1 + activeBanners.length) % activeBanners.length
    : 0;

  // 자동 슬라이드
  useEffect(() => {
    if (activeBanners.length <= 1 || !isAutoPlaying) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentSlide((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeBanners.length, isAutoPlaying]);

  // 무한 루프 처리: 끝에 도달하면 순간이동
  useEffect(() => {
    if (activeBanners.length <= 1) return;

    if (currentSlide === 0) {
      // 첫 번째 클론에 도달 -> 마지막 실제 슬라이드로 순간이동
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(activeBanners.length);
      }, 300);
      return () => clearTimeout(timeout);
    }

    if (currentSlide === extendedBanners.length - 1) {
      // 마지막 클론에 도달 -> 첫 번째 실제 슬라이드로 순간이동
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(1);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentSlide, activeBanners.length, extendedBanners.length]);

  const goToSlide = (index: number) => {
    setIsTransitioning(true);
    setCurrentSlide(index + 1); // 클론 오프셋
  };

  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev - 1);
  }, []);

  // 드래그 시작
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setTranslateX(0);
    setIsAutoPlaying(false);
  };

  // 드래그 중
  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setTranslateX(diff);
  };

  // 드래그 끝
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50; // 스와이프 임계값

    if (translateX > threshold) {
      prevSlide();
    } else if (translateX < -threshold) {
      nextSlide();
    }

    setTranslateX(0);

    // 3초 후 자동 재생 재개
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  // 마우스 이벤트
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

  // 터치 이벤트
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

  // 배너가 1개일 때는 단순 렌더링
  if (activeBanners.length === 1) {
    const banner = activeBanners[0];
    return (
      <div className="relative w-full bg-[#f5f3ef] overflow-hidden">
        {/* PC: 1440x501 비율 */}
        <div className="hidden md:block relative w-full aspect-[1440/501]">
          <Image
            src={banner.image_url}
            alt="메인 배너"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* 모바일: 393x153 비율 */}
        <div className="md:hidden relative w-full aspect-[393/153]">
          <Image
            src={banner.mobile_image_url || banner.image_url}
            alt="메인 배너"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#f5f3ef] overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 배너 슬라이드 컨테이너 */}
      <div
        className="flex"
        style={{
          transform: `translateX(calc(-${currentSlide * 100}% + ${isDragging ? translateX : 0}px))`,
          transition: isTransitioning && !isDragging ? 'transform 300ms ease-out' : 'none'
        }}
      >
        {extendedBanners.map((banner, index) => (
          <div
            key={`${banner.id}-${index}`}
            className="w-full flex-shrink-0"
          >
            {/* 데스크톱 레이아웃 - 1440x501 비율 */}
            <div className="hidden md:block relative w-full aspect-[1440/501]">
              <Image
                src={banner.image_url}
                alt="메인 배너"
                fill
                className="object-cover pointer-events-none"
                priority={index <= 2}
                draggable={false}
              />
            </div>

            {/* 모바일 레이아웃 - 393x153 비율 */}
            <div className="md:hidden relative w-full aspect-[393/153]">
              <Image
                src={banner.mobile_image_url || banner.image_url}
                alt="메인 배너"
                fill
                className="object-cover pointer-events-none"
                priority={index <= 2}
                draggable={false}
              />
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* 인디케이터 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
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
                ? 'bg-white w-6'
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
