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
          <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
            <p className="font-medium text-gray-800">의약품(조제 한약 등) 관련 교환 안내</p>
            <p>
              ① 한의약품(조제 한약 포함)은 「약사법」 및 관련 규정에 따라 조제 후
              보관·유통 과정에서 엄격한 안전성 확보가 요구되는 재화입니다. 따라서
              재화의 미개봉 여부와 관계없이 교환이 불가합니다. 이는 의약품의 품질
              및 안전성 보장을 위한 법적 의무 조치입니다.{" "}
              <span className="text-gray-500">
                *위 특칙은 일반 청약철회 규정보다 우선 적용됩니다.*
              </span>
            </p>
            <p>② 다만, 다음 각 호의 경우에는 예외적으로 교환 또는 재발송이 가능합니다.</p>
            <p>
              1. 제품의 파손 또는 오배송 등 &quot;미묘히&quot;의 귀책 사유가 있는 경우
              <br />
              → 왕복 배송비는 &quot;미묘히&quot;가 부담합니다.
            </p>
            <p>
              2. 소비자 귀책 사유(주소 오입력·부재 등)로 반송된 재화의 재발송을 요청하는 경우
              <br />
              → 왕복 배송비는 &quot;소비자&quot;가 부담합니다.
            </p>
            <p className="text-gray-500">
              *(단, 이는 &quot;교환&quot;이 아닌 &quot;재발송&quot; 절차로 처리되며, 환불 또는
              교환으로 간주되지 않습니다.)*
            </p>
          </div>
        </div>

        {/* REFUND INFO */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">
            REFUND INFO
          </h3>
          <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
            <p className="font-medium text-gray-800">의약품(조제 한약 등) 환불 안내</p>
            <p>
              &quot;미묘히&quot;에서 구매한 한의약품(조제 한약 포함)은 「약사법」 및 의약품
              안전관리 관련 규정에 따라 출고 후에는 제품 포장 개봉 여부와 관계없이
              환불(청약철회)이 불가합니다.
            </p>
            <p>
              한의약품은 개인별로 조제되는 의약품으로, 조제 후에는 안전성과 품질
              보증이 필수적인 재화이기 때문에 해당 기준은 일반 상품의 청약철회
              규정보다 우선 적용됩니다.
            </p>
            <p className="text-gray-500">
              - 체질에 맞지 않는 경우
              <br />
              - 기대한 효과를 느끼지 못한 경우
              <br />
              - 불편감이나 부작용이 발생한 경우에도
            </p>
            <p>
              이미 처방·조제·출고된 의약품에 대해서는 환불이 어려운 점 양해 부탁드립니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
