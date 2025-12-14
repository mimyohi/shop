"use client";

import Link from "next/link";
import Image from "next/image";

export default function BrandIntroSection() {
  return (
    <section className="bg-white">
      {/* 상단 히어로 섹션 */}
      <div className="bg-[#d4e8ec] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* 로고와 제품 이미지 */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <h2 className="text-4xl md:text-5xl font-light tracking-wider text-gray-700">
              MIMYOHI
            </h2>
            <div className="relative w-20 h-32 md:w-24 md:h-40">
              <Image
                src="/brand/product-stick.png"
                alt="MIMYOHI 제품"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* 타이틀 */}
          <h3 className="text-xl md:text-2xl font-medium text-gray-800 mb-6">
            미묘히, 과정에서 피어나는 아름다움
          </h3>

          {/* 설명 텍스트 */}
          <div className="text-sm md:text-base text-gray-600 leading-relaxed space-y-1">
            <p>세상에서 가장 부드러운 물이 단단한 바위를 이기는 이유는 흐름에 있습니다.</p>
            <p>물은 그저 자연스럽게 흘러가며,</p>
            <p>시간이 지나면 바위도 물의 모양을 따라 변해갑니다.</p>
            <p>우리의 몸도 강제로 틀을 맞추려 할 수록 저항이 생기고,</p>
            <p>억지로 잡으려 할 수록 반발이 커집니다.</p>
            <p>하지만 몸의 자연스러운 흐름을 따라</p>
            <p>다채로운 변화를 채워가면 놀랍도록 부드럽게,</p>
            <p>그리고 확실히 변화가 일어납니다.</p>
          </div>
        </div>
      </div>

      {/* 하단 2x2 그리드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* 왼쪽 상단 - 제품 이미지 */}
        <div className="relative aspect-square bg-[#f5f5f5]">
          <Image
            src="/brand/product-pouch.png"
            alt="MIMYOHI 제품 파우치"
            fill
            className="object-contain p-8"
          />
        </div>

        {/* 오른쪽 상단 - 텍스트 (회색 배경) */}
        <div className="bg-[#f0f0f0] p-8 md:p-12 flex flex-col justify-center">
          <p className="text-sm text-gray-500 tracking-wider mb-4">MIMYOHI</p>
          <h3 className="text-xl md:text-2xl font-medium text-[#5a9a9a] mb-4">
            미묘히,<br />
            과정에서 피어나는 아름다움
          </h3>
          <div className="text-xs md:text-sm text-gray-500 leading-relaxed space-y-0.5 mb-6">
            <p>세상에서 가장 부드러운 물이 단단한 바위를 이기는 이유는 흐름에 있습니다.</p>
            <p>물은 그저 자연스럽게 흘러가며,</p>
            <p>시간이 지나면 바위도 물의 모양을 따라 변해갑니다.</p>
            <p>우리의 몸도 강제로 틀을 맞추려 할 수록 저항이 생기고,</p>
            <p>억지로 잡으려 할 수록 반발이 커집니다.</p>
            <p>하지만 몸의 자연스러운 흐름을 따라</p>
            <p>다채로운 변화를 채워가면 놀랍도록 부드럽게,</p>
            <p>그리고 확실히 변화가 일어납니다.</p>
          </div>
          <Link
            href="/about"
            className="inline-flex items-center text-sm text-gray-600 border border-gray-400 rounded-full px-4 py-2 hover:bg-gray-100 transition w-fit"
          >
            브랜드스토리 →
          </Link>
        </div>

        {/* 왼쪽 하단 - 텍스트 (흰색 배경) */}
        <div className="bg-white p-8 md:p-12 flex flex-col justify-center order-4 md:order-3">
          <p className="text-sm text-gray-500 tracking-wider mb-4">MIMYOHI</p>
          <h3 className="text-xl md:text-2xl font-medium text-gray-800 mb-4">
            미묘히,<br />
            과정에서 피어나는 아름다움
          </h3>
          <div className="text-xs md:text-sm text-gray-500 leading-relaxed space-y-0.5 mb-6">
            <p>세상에서 가장 부드러운 물이 단단한 바위를 이기는 이유는 흐름에 있습니다.</p>
            <p>물은 그저 자연스럽게 흘러가며,</p>
            <p>시간이 지나면 바위도 물의 모양을 따라 변해갑니다.</p>
            <p>우리의 몸도 강제로 틀을 맞추려 할 수록 저항이 생기고,</p>
            <p>억지로 잡으려 할 수록 반발이 커집니다.</p>
            <p>하지만 몸의 자연스러운 흐름을 따라</p>
            <p>다채로운 변화를 채워가면 놀랍도록 부드럽게,</p>
            <p>그리고 확실히 변화가 일어납니다.</p>
          </div>
          <Link
            href="/about"
            className="inline-flex items-center text-sm text-gray-600 border border-gray-400 rounded-full px-4 py-2 hover:bg-gray-100 transition w-fit"
          >
            브랜드스토리 →
          </Link>
        </div>

        {/* 오른쪽 하단 - 제품 이미지 (알약/환) */}
        <div className="relative aspect-square bg-[#f5f5f5] order-3 md:order-4">
          <Image
            src="/brand/product-pills.png"
            alt="MIMYOHI 다이어트환"
            fill
            className="object-contain p-8"
          />
        </div>
      </div>
    </section>
  );
}
