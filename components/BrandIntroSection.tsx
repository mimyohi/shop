"use client";

import Image from "next/image";

export default function BrandIntroSection() {
  return (
    <section className="bg-white">
      {/* 상단 히어로 섹션 */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* 로고와 제품 이미지 */}
          <div className="relative flex items-center justify-center mb-12 h-[160px] md:h-[220px]">
            {/* 왼쪽 제품 이미지 (로고 뒤) */}
            <div className="absolute left-1/2 -translate-x-[140px] md:-translate-x-[240px] top-1/2 -translate-y-1/2 z-0">
              <div className="relative w-[100px] h-[150px] md:w-[150px] md:h-[220px] -rotate-[5deg]">
                <Image
                  src="/home/home-left.png"
                  alt="MIMYOHI 제품"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* 중앙 로고 */}
            <div className="relative w-[260px] h-[80px] md:w-[400px] md:h-[120px] z-10">
              <Image
                src="/home/home-logo.png"
                alt="MIMYOHI"
                fill
                className="object-contain"
              />
            </div>

            {/* 오른쪽 제품 이미지 (로고 앞) */}
            <div className="absolute left-1/2 translate-x-[30px] md:translate-x-[20px] top-1/2 -translate-y-1/2 z-20">
              <div className="relative w-[100px] h-[150px] md:w-[150px] md:h-[220px] rotate-[5deg]">
                <Image
                  src="/home/home-right.png"
                  alt="MIMYOHI 제품"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* 타이틀 */}
          <h3 className="text-xl md:text-2xl font-medium text-gray-800 mb-6">
            미묘히, 과정에서 피어나는 아름다움
          </h3>

          {/* 설명 텍스트 */}
          <div className="text-xs md:text-sm text-gray-500 leading-relaxed space-y-1">
            <p>
              세상에서 가장 부드러운 물이 단단한 바위를 이기는 이유는 흐름에
              있습니다.
            </p>
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

      {/* 하단 그리드 섹션 - PC */}
      <div className="hidden lg:flex max-w-7xl mx-auto flex-col gap-y-[40px] px-4 sm:px-6 lg:px-8">
        {/* 상단 행 */}
        <div className="flex gap-x-[30px]">
          {/* 왼쪽 상단 - 915*611 */}
          <div className="relative flex-1 aspect-915/611 rounded-[30px] overflow-hidden">
            <Image
              src="/home/pc_top_left.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>

          {/* 오른쪽 상단 - 915*611 */}
          <div className="relative flex-1 aspect-915/611 rounded-[30px] overflow-hidden">
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
          {/* 왼쪽 하단 - 724*611 */}
          <div className="relative aspect-724/611 rounded-[30px] overflow-hidden" style={{ flex: '724' }}>
            <Image
              src="/home/pc_bottom_left.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>

          {/* 오른쪽 하단 - 1106*611 */}
          <div className="relative aspect-1106/611 rounded-[30px] overflow-hidden" style={{ flex: '1106' }}>
            <Image
              src="/home/pc_bottom_right.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* 하단 그리드 섹션 - 태블릿 */}
      <div className="hidden md:flex lg:hidden max-w-3xl mx-auto flex-col gap-y-[40px] px-4 sm:px-6">
        {/* 상단 행 */}
        <div className="flex gap-x-[30px]">
          {/* 왼쪽 상단 - 675*611 */}
          <div className="relative flex-1 aspect-675/611 rounded-[30px] overflow-hidden">
            <Image
              src="/home/tablet_top_left.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>

          {/* 오른쪽 상단 - 675*611 */}
          <div className="relative flex-1 aspect-675/611 rounded-[30px] overflow-hidden">
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
          {/* 왼쪽 하단 - 563*611 */}
          <div className="relative aspect-563/611 rounded-[30px] overflow-hidden" style={{ flex: '563' }}>
            <Image
              src="/home/tablet_bottom_left.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>

          {/* 오른쪽 하단 - 787*611 */}
          <div className="relative aspect-787/611 rounded-[30px] overflow-hidden" style={{ flex: '787' }}>
            <Image
              src="/home/tablet_bottom_right.png"
              alt="MIMYOHI"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* 하단 그리드 섹션 - 모바일 */}
      <div className="flex md:hidden flex-col gap-y-[20px] px-4">
        {/* mobile_1 - 353*506 */}
        <div className="relative w-full aspect-[353/506] rounded-[20px] overflow-hidden">
          <Image
            src="/home/mobile_1.png"
            alt="MIMYOHI"
            fill
            className="object-cover"
          />
        </div>

        {/* mobile_2 - 353*280 */}
        <div className="relative w-full aspect-[353/280] rounded-[20px] overflow-hidden">
          <Image
            src="/home/mobile_2.png"
            alt="MIMYOHI"
            fill
            className="object-cover"
          />
        </div>

        {/* mobile_3 - 353*479 */}
        <div className="relative w-full aspect-[353/479] rounded-[20px] overflow-hidden">
          <Image
            src="/home/mobile_3.png"
            alt="MIMYOHI"
            fill
            className="object-cover"
          />
        </div>

        {/* mobile_4 - 353*280 */}
        <div className="relative w-full aspect-[353/280] rounded-[20px] overflow-hidden">
          <Image
            src="/home/mobile_4.png"
            alt="MIMYOHI"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
