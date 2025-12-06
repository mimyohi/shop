'use client';

/**
 * 배송지 입력 폼 컴포넌트 (배송비 실시간 계산 포함)
 */

import { useState, useEffect } from 'react';
import { useShippingFee } from '@/hooks/useShippingFee';

interface ShippingAddressFormProps {
  orderAmount: number; // 주문 금액
  onShippingFeeChange?: (shippingFee: number) => void; // 배송비 변경 콜백
  onAddressChange?: (address: AddressData) => void; // 주소 변경 콜백
}

export interface AddressData {
  recipientName: string;
  phone: string;
  zipcode: string;
  address: string;
  detailAddress: string;
}

export function ShippingAddressForm({
  orderAmount,
  onShippingFeeChange,
  onAddressChange,
}: ShippingAddressFormProps) {
  const [addressData, setAddressData] = useState<AddressData>({
    recipientName: '',
    phone: '',
    zipcode: '',
    address: '',
    detailAddress: '',
  });

  // 배송비 실시간 계산
  const { shippingFee, isLoading, error } = useShippingFee({
    orderAmount,
    zipcode: addressData.zipcode,
    enabled: true,
  });

  // 배송비 변경 시 부모 컴포넌트에 전달
  useEffect(() => {
    if (shippingFee && onShippingFeeChange) {
      onShippingFeeChange(shippingFee.totalShippingFee);
    }
  }, [shippingFee, onShippingFeeChange]);

  // 주소 변경 시 부모 컴포넌트에 전달
  useEffect(() => {
    if (onAddressChange) {
      onAddressChange(addressData);
    }
  }, [addressData, onAddressChange]);

  const handleInputChange = (field: keyof AddressData, value: string) => {
    setAddressData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 우편번호 검색 (Daum 우편번호 API)
  const handleSearchAddress = () => {
    if (typeof window === 'undefined') return;

    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        // 우편번호와 주소 정보 입력
        setAddressData((prev) => ({
          ...prev,
          zipcode: data.zonecode,
          address: data.address,
        }));
      },
    }).open();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">배송지 정보</h3>

      {/* 받는 사람 */}
      <div>
        <label className="block text-sm font-medium mb-1">받는 사람</label>
        <input
          type="text"
          value={addressData.recipientName}
          onChange={(e) => handleInputChange('recipientName', e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 연락처 */}
      <div>
        <label className="block text-sm font-medium mb-1">연락처</label>
        <input
          type="tel"
          value={addressData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="010-1234-5678"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 우편번호 */}
      <div>
        <label className="block text-sm font-medium mb-1">우편번호</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={addressData.zipcode}
            readOnly
            placeholder="우편번호"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
          <button
            type="button"
            onClick={handleSearchAddress}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            주소 검색
          </button>
        </div>
      </div>

      {/* 주소 */}
      <div>
        <label className="block text-sm font-medium mb-1">주소</label>
        <input
          type="text"
          value={addressData.address}
          readOnly
          placeholder="주소 검색 버튼을 눌러주세요"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
        />
      </div>

      {/* 상세 주소 */}
      <div>
        <label className="block text-sm font-medium mb-1">상세 주소</label>
        <input
          type="text"
          value={addressData.detailAddress}
          onChange={(e) => handleInputChange('detailAddress', e.target.value)}
          placeholder="상세 주소를 입력하세요"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 배송비 정보 */}
      {addressData.zipcode && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">배송비 정보</h4>

          {isLoading && (
            <p className="text-sm text-gray-600">배송비 계산 중...</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {shippingFee && !isLoading && (
            <div className="space-y-2 text-sm">
              {/* 지역 정보 */}
              {shippingFee.regionInfo.isJeju && (
                <p className="text-orange-600 font-medium">
                  📍 제주 지역 ({shippingFee.regionInfo.regionName})
                </p>
              )}
              {shippingFee.regionInfo.isMountain && (
                <p className="text-orange-600 font-medium">
                  📍 도서산간 지역 ({shippingFee.regionInfo.regionName})
                </p>
              )}

              {/* 배송비 상세 */}
              <div className="space-y-1">
                {!shippingFee.isFreeShipping && (
                  <p className="text-gray-700">
                    기본 배송비: {shippingFee.baseShippingFee.toLocaleString()}원
                  </p>
                )}

                {shippingFee.additionalFee > 0 && (
                  <p className="text-gray-700">
                    추가 배송비: {shippingFee.additionalFee.toLocaleString()}원
                  </p>
                )}

                <p className="text-lg font-bold text-blue-600">
                  총 배송비: {shippingFee.totalShippingFee.toLocaleString()}원
                </p>

                {/* 안내 메시지 */}
                {shippingFee.message && (
                  <p className="text-gray-600 text-xs mt-2">
                    {shippingFee.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daum 우편번호 API 스크립트 */}
      <script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        async
      />
    </div>
  );
}
