'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const faqData = [
  {
    question: '쿠폰을 어떻게 사용하나요?',
    answer: '주문서 작성 시 쿠폰 적용란에서 보유한 쿠폰을 선택하여 사용하실 수 있습니다. 쿠폰마다 사용 조건(최소 주문금액, 적용 가능 상품 등)이 다를 수 있으니 확인 후 사용해 주세요.',
  },
  {
    question: '발급 받은 쿠폰은 어디서 확인할 수 있나요?',
    answer: '마이페이지 > 쿠폰함에서 보유하신 쿠폰을 확인하실 수 있습니다. 쿠폰의 유효기간과 사용 조건도 함께 확인 가능합니다.',
  },
  {
    question: '상품 반품/교환 진행 시, 배송비가 부과되나요?',
    answer: '고객님의 단순 변심으로 인한 반품/교환 시에는 왕복 배송비(7,000원)가 부과됩니다. 상품 불량이나 오배송의 경우에는 미묘히에서 배송비를 부담합니다.',
  },
  {
    question: '주문 내역 조회는 어디서 하나요?',
    answer: '로그인 후 마이페이지 > 주문 내역에서 확인하실 수 있습니다. 주문 상태, 배송 현황, 결제 정보 등을 조회할 수 있습니다.',
  },
  {
    question: '아이디, 비밀번호가 기억이 나지 않습니다.',
    answer: '로그인 페이지에서 "아이디 찾기" 또는 "비밀번호 찾기"를 이용해 주세요. 가입 시 등록한 휴대폰 번호 또는 이메일을 통해 확인 가능합니다.',
  },
  {
    question: '회원정보를 수정하고 싶습니다.',
    answer: '마이페이지 > 회원정보 수정에서 비밀번호, 연락처, 배송지 등의 정보를 수정하실 수 있습니다.',
  },
  {
    question: '회원 탈퇴는 어떻게 하나요?',
    answer: '마이페이지 > 회원정보 수정 > 회원 탈퇴에서 진행하실 수 있습니다. 탈퇴 시 보유하신 쿠폰, 적립금 등은 모두 소멸되며 복구가 불가능합니다.',
  },
  {
    question: '비회원 구매 가능한가요?',
    answer: '미묘히는 회원 전용 서비스로, 비회원 구매는 지원하지 않습니다. 간단한 회원가입 후 다양한 혜택과 함께 편리하게 쇼핑해 주세요.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4">
            {/* 제목 */}
            <h1 className="text-center text-base font-medium mb-2">자주묻는질문</h1>
            <p className="text-center text-xs text-gray-500 mb-10">이용안내 FAQ입니다.</p>

            {/* FAQ 아코디언 */}
            <div className="border-t border-gray-200">
              {faqData.map((faq, index) => (
                <div key={index} className="border-b border-gray-200">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        Q
                      </span>
                      <span className="text-sm text-gray-900">{faq.question}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-4 ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openIndex === index && (
                    <div className="pb-4 pl-9">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8B8B73] flex items-center justify-center text-xs font-medium text-white">
                          A
                        </span>
                        <p className="text-sm text-gray-600 leading-relaxed pt-0.5">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 추가 문의 안내 */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-900 mb-1">더 궁금한 점이 있으신가요?</p>
              <p className="text-xs text-gray-500 mb-4">
                고객센터로 문의해 주시면 친절히 안내해 드리겠습니다.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <a href="tel:070-8655-2959" className="text-[#8B8B73] hover:underline">
                  070-8655-2959
                </a>
                <span className="text-gray-300">|</span>
                <a href="mailto:official.mimyohi@gmail.com" className="text-[#8B8B73] hover:underline">
                  official.mimyohi@gmail.com
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                평일 10:00~18:00 / 토요일 10:00~15:00
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
