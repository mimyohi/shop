'use client';

/**
 * 체크아웃 페이지 배송비 섹션
 * 기존 체크아웃 페이지에 통합하여 사용
 */

import { useEffect } from 'react';
import { useShippingFee } from '@/hooks/useShippingFee';

interface CheckoutShippingFeeSectionProps {
  orderAmount: number; // 상품 금액 (할인 전)
  zipcode: string; // 우편번호
  onShippingFeeChange: (shippingFee: number) => void; // 배송비 변경 콜백
}

export function CheckoutShippingFeeSection({
  orderAmount,
  zipcode,
  onShippingFeeChange,
}: CheckoutShippingFeeSectionProps) {
  const { shippingFee, isLoading, error } = useShippingFee({
    orderAmount,
    zipcode,
    enabled: !!zipcode && zipcode.length === 5,
  });

  // 배송비 변경 시 부모에 전달
  useEffect(() => {
    if (shippingFee) {
      onShippingFeeChange(shippingFee.totalShippingFee);
    } else {
      onShippingFeeChange(0);
    }
  }, [shippingFee, onShippingFeeChange]);

  if (!zipcode || zipcode.length !== 5) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          배송지를 입력하면 배송비가 계산됩니다.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">배송비 계산 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!shippingFee) {
    return null;
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="font-semibold mb-3">배송비</h4>

      <div className="space-y-2 text-sm">
        {/* 지역 정보 */}
        {(shippingFee.regionInfo.isJeju ||
          shippingFee.regionInfo.isMountain) && (
          <div className="bg-orange-50 p-2 rounded border border-orange-200">
            <p className="text-orange-700 font-medium">
              {shippingFee.regionInfo.isJeju && '📍 제주 지역'}
              {shippingFee.regionInfo.isMountain && '📍 도서산간 지역'}
              {shippingFee.regionInfo.regionName &&
                ` (${shippingFee.regionInfo.regionName})`}
            </p>
          </div>
        )}

        {/* 배송비 상세 */}
        <div className="space-y-1">
          {shippingFee.isFreeShipping && shippingFee.totalShippingFee === 0 ? (
            <p className="text-green-600 font-bold text-lg">무료배송</p>
          ) : (
            <>
              {!shippingFee.isFreeShipping && (
                <div className="flex justify-between text-gray-700">
                  <span>기본 배송비</span>
                  <span>{shippingFee.baseShippingFee.toLocaleString()}원</span>
                </div>
              )}

              {shippingFee.additionalFee > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>추가 배송비</span>
                  <span className="text-orange-600">
                    +{shippingFee.additionalFee.toLocaleString()}원
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>총 배송비</span>
                <span className="text-blue-600">
                  {shippingFee.totalShippingFee.toLocaleString()}원
                </span>
              </div>
            </>
          )}
        </div>

        {/* 안내 메시지 */}
        {shippingFee.message && (
          <div className="bg-white p-2 rounded border border-gray-200 mt-3">
            <p className="text-xs text-gray-600">{shippingFee.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
