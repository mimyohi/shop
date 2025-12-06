'use client';

import { useState } from 'react';

const faqs = [
  {
    id: 1,
    question: '배송은 얼마나 걸리나요?',
    answer: '주문 후 2-3일 이내에 배송됩니다. 제주도 및 도서산간 지역은 추가 배송일이 소요될 수 있습니다.'
  },
  {
    id: 2,
    question: '교환/환불은 어떻게 하나요?',
    answer: '상품 수령 후 7일 이내에 교환 및 환불이 가능합니다. 단, 사용하지 않은 새 제품에 한하며, 포장이 훼손되지 않아야 합니다.'
  },
  {
    id: 3,
    question: '회원가입 혜택이 있나요?',
    answer: '회원가입 시 즉시 사용 가능한 쿠폰을 제공하며, 적립금 혜택과 다양한 이벤트에 참여하실 수 있습니다.'
  },
  {
    id: 4,
    question: '결제 방법은 무엇이 있나요?',
    answer: '신용카드, 계좌이체, 가상계좌, 휴대폰 결제 등 다양한 결제 수단을 지원합니다.'
  },
  {
    id: 5,
    question: '재고가 없는 상품은 언제 입고되나요?',
    answer: '재고 문의는 고객센터로 연락주시면 입고 예정일을 안내해드립니다.'
  },
  {
    id: 6,
    question: '해외배송이 가능한가요?',
    answer: '현재는 국내 배송만 가능합니다. 해외배송은 준비 중에 있으며, 추후 공지 예정입니다.'
  },
  {
    id: 7,
    question: '상품 문의는 어떻게 하나요?',
    answer: '각 상품 페이지에서 문의하기를 통해 질문하실 수 있으며, 고객센터를 통해서도 문의 가능합니다.'
  },
  {
    id: 8,
    question: '적립금은 어떻게 사용하나요?',
    answer: '적립금은 다음 구매 시 결제 금액의 일부로 사용하실 수 있습니다. 최소 사용 금액 제한이 있을 수 있습니다.'
  }
];

export default function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
          자주 묻는 질문
        </h2>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition"
              >
                <span className="text-left font-medium text-gray-900">
                  Q. {faq.question}
                </span>
                <span className={`text-2xl transition-transform ${
                  openId === faq.id ? 'rotate-180' : ''
                }`}>
                  ▼
                </span>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  openId === faq.id
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 py-4 bg-white text-gray-700 leading-relaxed">
                  A. {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
