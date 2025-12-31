"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function BrandIntroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 1,
      }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-white">
      {/* 상단 히어로 섹션 */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* 로고와 제품 이미지 */}
          <div
            ref={heroRef}
            className="relative flex items-center justify-center mb-12 h-[200px] md:h-[300px]"
          >
            {/* 왼쪽 제품 이미지 (로고 뒤) */}
            <div
              className={`absolute left-1/2 -translate-x-[180px] md:-translate-x-[300px] top-[45%] z-0 transition-all duration-700 ease-out ${
                isVisible
                  ? "opacity-100 -translate-y-1/2"
                  : "opacity-0 -translate-y-[30%]"
              }`}
            >
              <div className="relative w-[170px] h-[195px] md:w-[280px] md:h-[300px]">
                <Image
                  src="/home/stick-left.png"
                  alt="MIMYOHI 제품"
                  fill
                  className="object-contain opacity-60"
                />
              </div>
            </div>

            {/* 중앙 로고 */}
            <div
              className={`relative w-[320px] h-[100px] md:w-[520px] md:h-[160px] z-10 transition-all duration-700 ease-out delay-150 ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <Image
                src="/home/home-logo.png"
                alt="MIMYOHI"
                fill
                className="object-contain"
              />
            </div>

            {/* 오른쪽 제품 이미지 (로고 앞) */}
            <div
              className={`absolute left-1/2 translate-x-[25px] md:translate-x-[30px] top-[45%] z-20 transition-all duration-700 ease-out delay-300 ${
                isVisible
                  ? "opacity-100 -translate-y-1/2"
                  : "opacity-0 -translate-y-[30%]"
              }`}
            >
              <div className="relative w-[150px] h-[195px] md:w-[250px] md:h-[300px]">
                <Image
                  src="/home/stick.png"
                  alt="MIMYOHI 제품"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* 타이틀 */}
          <h3
            className={`text-xl md:text-2xl font-medium text-[#588F83] mb-6 transition-all duration-700 ease-out delay-500 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            미묘히, 과정에서 피어나는 아름다움
          </h3>

          {/* 설명 텍스트 */}
          <div
            className={`text-xs md:text-sm text-[#588F83] leading-relaxed space-y-1 transition-all duration-700 ease-out delay-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <p>미묘히는 그 소중한 과정에 주목합니다.</p>
            <p>
              오늘 아침 거울 속 내 모습이 어제보다 조금 더 편안해 보이는 순간,
            </p>
            <p>계단을 오를 때 숨이 덜 차는 작은 변화,</p>
            <p>좋아하는 옷을 입었을 때 느껴지는 미묘한 자신감까지.</p>
            <p>이 모든 순간들이 모여 당신만의 아름다운 이야기가 됩니다.</p>
          </div>
        </div>
      </div>

      {/* 하단 그리드 섹션 - PC */}
      <div className="hidden lg:flex max-w-7xl mx-auto flex-col gap-y-[40px] px-4 sm:px-6 lg:px-8">
        {/* 상단 행 */}
        <div className="flex gap-x-[30px]">
          {/* 왼쪽 상단 - 915*526 */}
          <Link
            href="/brand"
            className="relative flex-1 aspect-915/526 rounded-[30px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Image
              src="/home/pc_top_left.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </Link>

          {/* 오른쪽 상단 - 915*526 */}
          <div className="relative flex-1 aspect-915/526 rounded-[30px] overflow-hidden">
            <Image
              src="/home/pc_top_right.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* 하단 행 */}
        <div className="flex gap-x-[30px]">
          {/* 왼쪽 하단 - 724*516 */}
          <div
            className="relative aspect-724/516 rounded-[30px] overflow-hidden"
            style={{ flex: "724" }}
          >
            <Image
              src="/home/pc_bottom_left.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>

          {/* 오른쪽 하단 - 1106*516 */}
          <Link
            href="/brand"
            className="relative aspect-1106/516 rounded-[30px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            style={{ flex: "1106" }}
          >
            <Image
              src="/home/pc_bottom_right.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </Link>
        </div>
      </div>

      {/* 하단 그리드 섹션 - 태블릿 */}
      <div className="hidden md:flex lg:hidden max-w-3xl mx-auto flex-col gap-y-[40px] px-4 sm:px-6">
        {/* 상단 행 */}
        <div className="flex gap-x-[30px]">
          {/* 왼쪽 상단 - 675*526 */}
          <Link
            href="/brand"
            className="relative flex-1 aspect-675/526 rounded-[30px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Image
              src="/home/tablet_top_left.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </Link>

          {/* 오른쪽 상단 - 675*526 */}
          <div className="relative flex-1 aspect-675/526 rounded-[30px] overflow-hidden">
            <Image
              src="/home/tablet_top_right.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* 하단 행 */}
        <div className="flex gap-x-[30px]">
          {/* 왼쪽 하단 - 563*516 */}
          <div
            className="relative aspect-563/516 rounded-[30px] overflow-hidden"
            style={{ flex: "563" }}
          >
            <Image
              src="/home/tablet_bottom_left.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>

          {/* 오른쪽 하단 - 787*516 */}
          <Link
            href="/brand"
            className="relative aspect-787/516 rounded-[30px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            style={{ flex: "787" }}
          >
            <Image
              src="/home/tablet_bottom_right.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </Link>
        </div>
      </div>

      {/* 하단 그리드 섹션 - 모바일 */}
      <div className="flex md:hidden flex-col gap-y-[20px] px-4">
        {/* mobile_1 - 353*506 */}
        <Link
          href="/brand"
          className="relative w-full aspect-353/506 rounded-[20px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Image
            src="/home/mobile_1.png"
            alt="MIMYOHI"
            fill
            className="object-cover"
          />
        </Link>

        {/* mobile_2 - 353*280 */}
        <div className="relative w-full aspect-353/280 rounded-[20px] overflow-hidden">
          <Image
            src="/home/mobile_2.png"
            alt="MIMYOHI"
            fill
            className="object-cover"
          />
        </div>

        {/* mobile_3 - 353*479 */}
        <div className="relative w-full aspect-353/479 rounded-[20px] overflow-hidden">
          <Image
            src="/home/mobile_3.png"
            alt="MIMYOHI"
            fill
            className="object-cover"
          />
        </div>

        {/* mobile_4 - 353*280 */}
        <Link
          href="/brand"
          className="relative w-full aspect-353/280 rounded-[20px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Image
            src="/home/mobile_4.png"
            alt="MIMYOHI"
            fill
            className="object-cover"
          />
        </Link>
      </div>
    </section>
  );
}
