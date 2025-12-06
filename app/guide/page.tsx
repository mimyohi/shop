'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const guideData = [
  {
    title: '회원가입 안내',
    content: `■ 회원가입

① 이용자는 "회원가입" 절차를 통해 서비스 이용약관 및 개인정보처리방침에 동의하고, 가입 양식에 필요한 정보를 기재함으로써 회원으로 가입됩니다. 회원가입이 완료되면 즉시 "미묘히"의 일반 서비스를 이용할 수 있습니다.

② 회원으로 가입하시면 주문·결제 시 필요한 정보를 매번 입력할 필요 없이 간편하게 이용하실 수 있습니다.

③ 회원은 "미묘히"에서 제공하는 공동구매, 프로모션, 이벤트, 할인 혜택 등 회원 대상 서비스에 우선적으로 참여할 수 있습니다. 단, 각 서비스는 별도의 운영정책에 따라 제공될 수 있습니다.`,
  },
  {
    title: '주문 안내',
    content: `■ 상품주문 및 결제 절차

"미묘히"에서의 상품 주문은 다음 단계에 따라 이루어집니다.

1. 상품 검색 및 선택
2. 장바구니 담기
3. 회원 로그인
4. 주문서 작성(수령자 정보·배송지·결제정보 입력)
5. 결제수단 선택 및 결제 진행
6. 주문 완료 화면 확인(주문번호 발급)

미묘히의 서비스 특성상 상품 주문 및 결제는 회원에게만 제공되며, 비회원 주문은 지원하지 않습니다.

회원으로 주문한 경우, 주문번호 및 결제 정보는 계정 내에서 자동 저장되며 언제든지 조회할 수 있습니다.`,
  },
  {
    title: '결제안내',
    content: `■ 결제 및 주문 확인

① 고액 결제의 경우, 결제 안전을 위해 카드사 또는 결제대행사(PG)에서 이용자에게 확인 전화를 할 수 있습니다. 확인 과정에서 도난 카드 사용, 타인 명의 결제, 비정상 주문 등이 의심되는 경우 "미묘히"는 주문을 보류하거나 취소할 수 있습니다.

② 무통장입금(계좌이체) 결제를 선택한 경우, 이용자는 PC뱅킹·인터넷뱅킹·모바일뱅킹 또는 은행 창구를 통해 직접 결제 금액을 입금하실 수 있습니다.

③ 주문 시 입력한 입금자명과 실제 입금자명은 반드시 일치해야 하며, 지정된 기한(7일 이내) 내 입금이 완료되지 않은 주문은 자동 취소됩니다.`,
  },
  {
    title: '배송안내',
    content: `• 배송 방법 : 택배
• 배송 지역 : 전국지역
• 배송 비용 : 조건부 무료 - 주문 금액 250,000원 미만일 때 배송비 3,500원을 추가합니다.
• 배송 기간 : 2일 ~ 7일

■ 배송 안내

① 제주도 지역의 배송비는 3,000원, 도서산간 지역의 배송비는 5,000원이 추가 부과됩니다.`,
  },
  {
    title: '교환/반품안내',
    content: `■ 교환 및 반품이 가능한 경우

- 계약내용에 관한 서면을 받은 날부터 7일. 단, 그 서면을 받은 때보다 재화등의 공급이 늦게 이루어진 경우에는 재화등을 공급받거나 재화등의 공급이 시작된 날부터 7일 이내

- 공급받으신 상품 및 용역의 내용이 표시.광고 내용과 다르거나 계약내용과 다르게 이행된 때에는 당해 재화 등을 공급받은 날 부터 3월이내, 그사실을 알게 된 날 또는 알 수 있었던 날부터 30일이내

■ 교환 및 반품이 불가능한 경우

- 이용자에게 책임 있는 사유로 재화 등이 멸실 또는 훼손된 경우(다만, 재화 등의 내용을 확인하기 위하여 포장 등을 훼손한 경우에는 청약철회를 할 수 있습니다)

- 이용자의 사용 또는 일부 소비에 의하여 재화 등의 가치가 현저히 감소한 경우

- 시간의 경과에 의하여 재판매가 곤란할 정도로 재화등의 가치가 현저히 감소한 경우

- 복제가 가능한 재화등의 포장을 훼손한 경우

- 개별 주문 생산되는 재화 등 청약철회시 판매자에게 회복할 수 없는 피해가 예상되어 소비자의 사전 동의를 얻은 경우

- 디지털 콘텐츠의 제공이 개시된 경우, (다만, 가분적 용역 또는 가분적 디지털콘텐츠로 구성된 계약의 경우 제공이 개시되지 아니한 부분은 청약철회를 할 수 있습니다.)

※ 고객님의 마음이 바뀌어 교환, 반품을 하실 경우 상품반송 비용은 고객님께서 부담하셔야 합니다.`,
  },
  {
    title: '환불안내',
    content: `환불시 반품 확인여부를 확인한 후 3영업일 이내에 결제 금액을 환불해 드립니다.

신용카드로 결제하신 경우는 신용카드 승인을 취소하여 결제 대금이 청구되지 않게 합니다.

(단, 신용카드 결제일자에 맞추어 대금이 청구 될수 있으면 이경우 익월 신용카드 대금청구시 카드사에서 환급처리됩니다.)`,
  },
  {
    title: '기타안내',
    content: `-`,
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
            <h1 className="text-center text-base font-medium mb-10">이용안내</h1>

            {/* 이용안내 아코디언 */}
            <div className="border-t border-gray-200">
              {guideData.map((section, index) => (
                <div key={index} className="border-b border-gray-200">
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium text-gray-900">{section.title}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        openSections.has(index) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
