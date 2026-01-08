"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#CBE5DE] rounded-t-[40px]">
      {/* 로고 섹션 */}
      <div className="border-b border-[#67645E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[60px] flex justify-center">
          <Link href="/">
            <Image
              src="/footer_logo.png"
              alt="MIMYOHI"
              width={264}
              height={64}
              className="h-[48px] w-auto"
            />
          </Link>
        </div>
      </div>

      {/* PC 메인 콘텐츠 */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2">
            {/* 왼쪽: 쇼핑몰 기본정보 */}
            <div className="text-xs text-gray-500 leading-relaxed border-r border-[#67645E] pr-8 py-10">
              <div className="mb-6">
                <p className="font-medium text-gray-700 mb-2">
                  쇼핑몰 기본정보
                </p>
                <p>
                  <span className="font-medium text-gray-600">상호명</span>{" "}
                  미묘히 ·{" "}
                  <span className="font-medium text-gray-600">대표자명</span>{" "}
                  정상원
                </p>
                <p>
                  <span className="font-medium text-gray-600">사업장 주소</span>{" "}
                  06628 서울 서초구 효령로 429 1414호 (서초동)
                </p>
                <p>
                  <span className="font-medium text-gray-600">대표 전화</span>{" "}
                  070-8655-2959 ·{" "}
                  <span className="font-medium text-gray-600">
                    사업자 등록번호
                  </span>{" "}
                  431-87-03798
                </p>
                <p>
                  <span className="font-medium text-gray-600">
                    통신판매업 신고번호
                  </span>{" "}
                  기타 ·{" "}
                  <span className="font-medium text-gray-600">
                    개인정보보호책임자
                  </span>{" "}
                  정상원
                </p>
              </div>

              <div className="mb-6">
                <p className="font-medium text-gray-700 mb-2">고객센터 정보</p>
                <p>
                  <span className="font-medium text-gray-600">
                    상담/주문 전화
                  </span>{" "}
                  070-8655-2959
                </p>
                <p>
                  <span className="font-medium text-gray-600">
                    상담/주문 이메일
                  </span>{" "}
                  official.mimyohi@gmail.com
                </p>
                <p className="font-medium text-gray-600 mt-2">CS운영시간</p>
                <p>평일 : 10:00~18:00</p>
                <p>토요일 : 10:00~15:00</p>
              </div>
            </div>

            {/* 오른쪽: 네비게이션 링크들 */}
            <div className="grid grid-cols-3 gap-8 pl-8 py-10">
              {/* NAVIGATE */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-4 tracking-wide">
                  NAVIGATE
                </h4>
                <ul className="space-y-3 text-xs text-gray-500">
                  {/** TODO */}
                  {/* <li>
                    <Link
                      href="/brand"
                      className="hover:text-gray-900 transition"
                    >
                      Brand
                    </Link>
                  </li> */}
                  <li>
                    <Link
                      href="/products"
                      className="hover:text-gray-900 transition"
                    >
                      Shop
                    </Link>
                  </li>
                </ul>
              </div>

              {/* SOCIAL */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-4 tracking-wide">
                  SOCIAL
                </h4>
                <ul className="space-y-3 text-xs text-gray-500">
                  <li>
                    <a
                      href="https://instagram.com/mimyohi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gray-900 transition flex items-center gap-1"
                    >
                      <span>@</span> Instagram
                    </a>
                  </li>
                </ul>
              </div>

              {/* OFFICIAL */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-4 tracking-wide">
                  OFFICIAL
                </h4>
                <ul className="space-y-3 text-xs text-gray-500">
                  <li>
                    <Link
                      href="/about"
                      className="hover:text-gray-900 transition"
                    >
                      회사소개
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="hover:text-gray-900 transition"
                    >
                      이용약관
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="hover:text-gray-900 transition"
                    >
                      개인정보처리방침
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/guide"
                      className="hover:text-gray-900 transition"
                    >
                      이용안내
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/faq"
                      className="hover:text-gray-900 transition"
                    >
                      자주묻는질문(FAQ)
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 레이아웃 - 네비게이션 */}
      <div className="md:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-3 gap-4">
            {/* NAVIGATE */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-3 tracking-wide">
                NAVIGATE
              </h4>
              <ul className="space-y-2 text-xs text-gray-500">
                {/** TODO */}
                {/*
                <li>
                  <Link
                    href="/brand"
                    className="hover:text-gray-900 transition"
                  >
                    Brand
                  </Link>
                </li>
                */}
                <li>
                  <Link
                    href="/products"
                    className="hover:text-gray-900 transition"
                  >
                    Shop
                  </Link>
                </li>
              </ul>
            </div>

            {/* SOCIAL */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-3 tracking-wide">
                SOCIAL
              </h4>
              <ul className="space-y-2 text-xs text-gray-500">
                <li>
                  <a
                    href="https://instagram.com/mimyohi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-900 transition"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>

            {/* OFFICIAL */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-3 tracking-wide">
                OFFICIAL
              </h4>
              <ul className="space-y-2 text-xs text-gray-500">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-gray-900 transition"
                  >
                    회사소개
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-gray-900 transition"
                  >
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-gray-900 transition"
                  >
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guide"
                    className="hover:text-gray-900 transition"
                  >
                    이용안내
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-gray-900 transition">
                    자주묻는질문(FAQ)
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 구분선 - 전체 너비 */}
      <div className="md:hidden border-b border-[#67645E]"></div>

      {/* 모바일 레이아웃 - 쇼핑몰 기본정보 */}
      <div className="md:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-xs text-gray-500 leading-relaxed">
            <div className="mb-6">
              <p className="font-medium text-gray-700 mb-2">쇼핑몰 기본정보</p>
              <p>
                <span className="font-medium text-gray-600">상호명</span> 미묘히
                · <span className="font-medium text-gray-600">대표자명</span>{" "}
                정상원
              </p>
              <p>
                <span className="font-medium text-gray-600">사업장 주소</span>{" "}
                06628 서울 서초구 효령로 429 1414호 (서초동)
              </p>
              <p>
                <span className="font-medium text-gray-600">대표 전화</span>{" "}
                070-8655-2959 ·{" "}
                <span className="font-medium text-gray-600">
                  사업자 등록번호
                </span>{" "}
                431-87-03798
              </p>
              <p>
                <span className="font-medium text-gray-600">
                  통신판매업 신고번호
                </span>{" "}
                기타 ·{" "}
                <span className="font-medium text-gray-600">
                  개인정보보호책임자
                </span>{" "}
                정상원
              </p>
            </div>

            <div className="mb-6">
              <p className="font-medium text-gray-700 mb-2">고객센터 정보</p>
              <p>
                <span className="font-medium text-gray-600">
                  상담/주문 전화
                </span>{" "}
                070-8655-2959
              </p>
              <p>
                <span className="font-medium text-gray-600">
                  상담/주문 이메일
                </span>{" "}
                official.mimyohi@gmail.com
              </p>
              <p className="font-medium text-gray-600 mt-2">CS운영시간</p>
              <p>평일 : 10:00~18:00</p>
              <p>토요일 : 10:00~15:00</p>
            </div>

            <div>
              <p className="font-medium text-gray-700 mb-2">결제정보</p>
              <p className="font-medium text-gray-600">무통장 계좌정보</p>
              <p>하나은행 130-910035-36804 주식회사 미묘히</p>
            </div>
          </div>
        </div>
      </div>

      {/* 저작권 */}
      <div className="border-t border-[#67645E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-[#67645E]">
            Copyright © 미묘히. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
