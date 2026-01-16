"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const guideData = [
  {
    title: "회원가입 안내",
    content: `■ 회원가입

① 이용자는 “회원가입” 절차를 통해 서비스 이용약관 및 개인정보처리방침에 동의하고, 가입 양식에 필요한 정보를 기재함으로써 회원으로 가입됩니다. 회원가입이 완료되면 즉시 “미묘히”의 일반 서비스를 이용할 수 있습니다.

② 회원으로 가입하시면 주문·결제 시 필요한 정보를 매번 입력할 필요 없이 간편하게 이용하실 수 있습니다.

③ 회원은 “미묘히”에서 제공하는 공동구매, 프로모션, 이벤트, 할인 혜택 등 회원 대상 서비스에 우선적으로 참여할 수 있습니다. 단, 각 서비스는 별도의 운영정책에 따라 제공될 수 있습니다.`,
  },
  {
    title: "주문 안내",
    content: `■ 상품주문 및 결제 절차

“미묘히”에서의 상품 주문은 아래 절차에 따라 진행됩니다.

1. 상품 검색 및 선택
2. 장바구니 담기
3. 회원 로그인
4. 주문서 작성 (수령자 정보·배송지·결제정보 입력)
5. 결제수단 선택 및 결제 진행
6. 설문지 작성 및 주문 완료 화면 확인 (주문번호 발급)
7. 한의원 전화진료 진행
8. 개인 맞춤 처방 및 출고

미묘히의 서비스 특성상, 상품 주문 및 결제는 ‘회원 전용 서비스’로 제공되며

비회원 주문은 지원하지 않습니다.

회원으로 주문한 경우, 주문번호 및 결제 정보는 회원 계정 내에서 자동 저장되며

언제든지 마이페이지에서 조회하실 수 있습니다.`,
  },
  {
    title: "결제안내",
    content: `■ 결제 및 주문 확인

① 고액 결제의 경우, 결제 안전을 위해 카드사 또는 결제대행사(PG)에서 이용자에게 확인 전화를 할 수 있습니다.

확인 과정에서 도난 카드 사용, 타인 명의 결제, 비정상 주문 등이 의심되는 경우 “미묘히”는 주문을 보류하거나 취소할 수 있습니다.

② 무통장입금(계좌이체) 결제를 선택한 경우, 이용자는 PC뱅킹·인터넷뱅킹·모바일뱅킹 또는 은행 창구를 통해 직접 결제 금액을 입금하실 수 있습니다.

③ 주문 시 입력한 입금자명과 실제 입금자명은 반드시 일치해야 합니다.`,
  },
  {
    title: "배송안내",
    content: `■ 배송 안내

① 제주도 지역의 배송비는 3,000원, 도서산간 지역의 배송비는 5,000원이 추가 부과됩니다.

② 주문 건은 결제(입금) 확인 후 전화진료를 진행한 다음, 배송 절차를 개시합니다.

③  전화진료는 결제 순서에 따라 진행되며, 상담 상황에 따라 일정이 지연될 수 있습니다.`,
  },
  {
    title: "교환/반품안내",
    content: `■ 의약품(조제 한약 등) 관련 교환 안내

① 한의약품(조제 한약 포함)은 「약사법」 및 관련 규정에 따라 조제 후 보관·유통 과정에서 엄격한 안전성 확보가 요구되는 재화입니다. 따라서 재화의 미개봉 여부와 관계없이 교환이 불가합니다. 이는 의약품의 품질 및 안전성 보장을 위한 법적 의무 조치입니다. *위 특칙은 일반 청약철회 규정보다 우선 적용됩니다.*

② 다만, 다음 각 호의 경우에는 예외적으로 교환 또는 재발송이 가능합니다.

1. 제품의 파손 또는 오배송 등 “미묘히”의 귀책 사유가 있는 경우

→ 왕복 배송비는 “미묘히”가 부담합니다.

2. 소비자 귀책 사유(주소 오입력·부재 등)로 반송된 재화의 재발송을 요청하는 경우

→ 왕복 배송비는 “소비자”가 부담합니다.

*(단, 이는 “교환”이 아닌 “재발송” 절차로 처리되며, 환불 또는 교환으로 간주되지 않습니다.)*`,
  },
  {
    title: "환불안내",
    content: `■ 의약품(조제 한약 등) 환불 안내

“미묘히”에서 구매한 한의약품(조제 한약 포함)은「약사법」 및 의약품 안전관리 관련 규정에 따라

출고 후에는 제품 포장 개봉 여부와 관계없이 환불(청약철회)이 불가합니다.

한의약품은 개인별로 조제되는 의약품으로,

조제 후에는 안전성과 품질 보증이 필수적인 재화이기 때문에

해당 기준은 일반 상품의 청약철회 규정보다 우선 적용됩니다.

- 체질에 맞지 않는 경우
- 기대한 효과를 느끼지 못한 경우
- 불편감이나 부작용이 발생한 경우에도

이미 처방·조제·출고된 의약품에 대해서는 환불이 어려운 점 양해 부탁드립니다.`,
  },
  {
    title: "기타안내",
    content: `위 기준은 모든 의료기관 및 처방 의약품에 동일하게 적용되는 의약품 특칙임을 안내드립니다.`,
  },
];

export default function GuidePage() {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(index)) {
      newOpenSections.delete(index);
    } else {
      newOpenSections.add(index);
    }
    setOpenSections(newOpenSections);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4">
            {/* 제목 */}
            <h1 className="text-center text-base font-medium mb-10">
              이용안내
            </h1>

            {/* 이용안내 아코디언 */}
            <div className="border-t border-gray-200">
              {guideData.map((section, index) => (
                <div key={index} className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {section.title}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        openSections.has(index) ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openSections.has(index) && (
                    <div className="pb-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 leading-relaxed">
                        {section.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
