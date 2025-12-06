/**
 * 배송비 계산 React Hook
 */

import { useState, useEffect } from 'react';

export interface ShippingFeeData {
  baseShippingFee: number;
  additionalFee: number;
  totalShippingFee: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  regionInfo: {
    isJeju: boolean;
    isMountain: boolean;
    regionName?: string;
  };
  message?: string;
}

interface UseShippingFeeParams {
  orderAmount: number;
  zipcode: string;
  enabled?: boolean; // 자동 계산 활성화 여부
}

interface UseShippingFeeResult {
  shippingFee: ShippingFeeData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useShippingFee({
  orderAmount,
  zipcode,
  enabled = true,
}: UseShippingFeeParams): UseShippingFeeResult {
  const [shippingFee, setShippingFee] = useState<ShippingFeeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShippingFee = async () => {
    // 우편번호가 5자리 숫자가 아니면 계산하지 않음
    if (!zipcode || !/^\d{5}$/.test(zipcode)) {
      setShippingFee(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderAmount,
          zipcode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '배송비 계산에 실패했습니다.');
      }

      setShippingFee(result.data);
    } catch (err) {
      console.error('배송비 계산 오류:', err);
      setError(err instanceof Error ? err.message : '배송비 계산 중 오류가 발생했습니다.');
      setShippingFee(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && orderAmount > 0 && zipcode) {
      fetchShippingFee();
    }
  }, [orderAmount, zipcode, enabled]);

  return {
    shippingFee,
    isLoading,
    error,
    refetch: fetchShippingFee,
  };
}
