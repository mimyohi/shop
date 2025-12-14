"use client";

export default function ProductInfoSections() {
  return (
    <div className="mt-16 border-t border-gray-200 pt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* PAYMENT INFO */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">
            PAYMENT INFO
          </h3>
          <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
            <p className="font-medium text-gray-800">결제 및 주문 확인</p>
            <p>
              ① 고액 결제의 경우, 결제 안전을 위해 카드사 또는
              결제대행사(PG)에서 이용자에게 확인 전화를 할 수 있습니다.
              <br />
              확인 과정에서 도난 카드 사용, 타인 명의 결제, 비정상 주문 등의
              의심되는 경우 &quot;미묘히&quot;는 주문을 보류하거나 취소할 수
              있습니다.
            </p>
            <p>
              ② 무통장입금(계좌이체) 결제를 선택한 경우, 이용자는
              PC뱅킹·인터넷뱅킹·모바일뱅킹 또는 은행 창구를 통해 직접 결제
              금액을 입금하실 수 있습니다.
            </p>
            <p>
              ③ 주문 시 입력한 입금자명과 실제 입금자명은 반드시 일치해야 하며,
              <br />
              지정된 기한(7일 이내) 내 입금이 완료되지 않은 주문은 자동
              취소됩니다.
            </p>
          </div>
        </div>

        {/* DELIVERY INFO */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">
            DELIVERY INFO
          </h3>
          <ul className="text-sm text-gray-600 space-y-1 leading-relaxed">
            <li>• 배송 방법 : 택배</li>
            <li>• 배송 지역 : 전국지역</li>
            <li>• 배송 비용 : 3,500원</li>
            <li>• 배송 기간 : 2일 ~ 7일</li>
            <li>• 배송 안내</li>
            <li className="ml-3 mt-2">
              제주도 지역의 배송비는 3,000원, 도서산간 지역의 배송비는 5,000원이
              추가 부과됩니다.
            </li>
          </ul>
        </div>

        {/* EXCHANGE INFO */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">
            EXCHANGE INFO
          </h3>
          <div className="text-sm text-gray-600 space-y-4 leading-relaxed">
            <div>
              <p className="font-medium text-gray-800 mb-2">
                교환 및 반품이 가능한 경우
              </p>
              <p>
                - 계약내용에 관한 서면을 받은 날부터 7일. 단, 그 서면을 받은
                때보다 재화등의 공급이 늦게 이루어진 경우에는 재화등을
                공급받거나 재화등의 공급이 시작된 날부터 7일 이내
              </p>
              <p>
                - 공급받으신 상품 및 용역의 내용이 표시·광고 내용과 다르거나
                계약내용과 다르게 이행된 때에는 당해 재화 등을 공급받은 날 부터
                3월이내, 그 사실을 알게 된 날 또는 알 수 있었던 날부터 30일이내
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 mb-2">
                교환 및 반품이 불가능한 경우
              </p>
              <p>
                - 이용자에게 책임 있는 사유로 재화 등이 멸실 또는 훼손된
                경우(다만, 재화 등의 내용을 확인하기 위하여 포장 등을 훼손한
                경우에는 청약철회를 할 수 있습니다)
              </p>
              <p>
                - 이용자의 사용 또는 일부 소비에 의하여 재화 등의 가치가 현저히
                감소한 경우
              </p>
              <p>
                - 시간의 경과에 의하여 재판매가 곤란할 정도로 재화등의 가치가
                현저히 감소한 경우
              </p>
              <p>- 복제가 가능한 재화등의 포장을 훼손한 경우</p>
              <p>
                - 개별 주문 생산되는 재화 등 청약철회시 판매자에게 회복할 수
                없는 피해가 예상되어 소비자의 사전 동의를 얻은 경우
              </p>
              <p>
                - 디지털 콘텐츠의 제공이 개시된 경우, (다만, 가분적 용역 또는
                가분적 디지털콘텐츠로 구성된 계약의 경우 제공이 개시되지 아니한
                부분은 청약철회를 할 수 있습니다.)
              </p>
            </div>
            <p className="text-gray-500 mt-4">
              ※ 고객님의 마음이 바뀌어 교환, 반품을 하실 경우 상품반송 비용은
              고객님께서 부담하셔야 합니다.
            </p>
          </div>
        </div>

        {/* SERVICE INFO */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">
            SERVICE INFO
          </h3>
          <div className="text-sm text-gray-600 leading-relaxed">
            <p>고객센터 운영시간: 평일 10:00 ~ 18:00 (점심 12:00 ~ 13:00)</p>
            <p className="mt-1">토/일/공휴일 휴무</p>
          </div>
        </div>
      </div>
    </div>
  );
}
