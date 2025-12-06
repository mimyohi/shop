# 제주·도서산간 지역 추가 배송비 자동 계산 기능 구현 가이드

## 개요

이 가이드는 우편번호 기반으로 제주 및 도서산간 지역을 자동 판별하고, 추가 배송비를 계산하여 결제 전 백엔드에서 검증하는 전체 시스템 구현 방법을 설명합니다.

## 구현 완료 항목

### 1. DB 스키마 설계 ✅

**파일 위치:** `supabase/migrations/20250122_shipping_fee_setup.sql`

**테이블 구조:**

- `shipping_settings`: 배송비 설정 (기본 배송비, 무료배송 기준, 추가 배송비 등)
- `mountain_zipcodes`: 제주 및 도서산간 우편번호 데이터

**마이그레이션 실행:**

```bash
# Supabase CLI 사용
supabase db push

# 또는 Supabase 대시보드에서 SQL Editor로 실행
```

### 2. 우편번호 기반 지역 판별 유틸리티 ✅

**파일 위치:** `lib/shipping/zipcode-utils.ts`

**주요 함수:**

- `isJejuByZipcode(zipcode)`: 제주 지역 판별 (63000-63644 범위)
- `getRegionInfo(zipcode)`: DB 기반 지역 정보 조회
- `isValidZipcode(zipcode)`: 우편번호 유효성 검사

**사용 예시:**

```typescript
import { getRegionInfo } from "@/lib/shipping/zipcode-utils";

const regionInfo = await getRegionInfo("63000");
console.log(regionInfo);
// {
//   isJeju: true,
//   isMountain: false,
//   regionName: '제주',
//   additionalFee: 3000
// }
```

### 3. 배송비 계산 로직 ✅

**파일 위치:** `lib/shipping/calculate-shipping-fee.ts`

**주요 함수:**

- `calculateShippingFee(params)`: 배송비 계산 메인 함수
- `recalculateShippingFeeForValidation()`: 결제 검증용 재계산 함수
- `getShippingSettings()`: 배송비 설정 조회

**계산 로직:**

1. 주문 금액이 무료배송 기준 이상이면 기본 배송비 무료
2. 제주/도서산간 지역은 무료배송이어도 추가 배송비 부과
3. 일반 지역 + 기본 배송비 필요 시: 기본 배송비만 부과

**사용 예시:**

```typescript
import { calculateShippingFee } from "@/lib/shipping/calculate-shipping-fee";

const result = await calculateShippingFee({
  orderAmount: 45000,
  zipcode: "63000",
});

console.log(result);
// {
//   baseShippingFee: 3000,
//   additionalFee: 3000,
//   totalShippingFee: 3000, // 무료배송이지만 제주 추가 배송비
//   isFreeShipping: false,
//   freeShippingThreshold: 50000,
//   message: '3,000원 (제주 추가 배송비 포함) - 5,000원 더 구매 시 기본 배송비 무료'
// }
```

### 4. API 엔드포인트 ✅

**파일 위치:** `app/api/shipping/calculate/route.ts`

**엔드포인트:**

#### POST `/api/shipping/calculate`

배송비 계산 요청

**요청:**

```json
{
  "orderAmount": 45000,
  "zipcode": "63000"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "baseShippingFee": 3000,
    "additionalFee": 3000,
    "totalShippingFee": 3000,
    "isFreeShipping": false,
    "freeShippingThreshold": 50000,
    "regionInfo": {
      "isJeju": true,
      "isMountain": false,
      "regionName": "제주"
    },
    "message": "3,000원 (제주 추가 배송비 포함)"
  }
}
```

#### GET `/api/shipping/calculate`

배송비 설정 조회

**응답:**

```json
{
  "success": true,
  "data": {
    "base_shipping_fee": 3000,
    "free_shipping_threshold": 50000,
    "jeju_additional_fee": 3000,
    "mountain_additional_fee": 5000
  }
}
```

### 5. 결제 검증 로직 ✅

**파일 위치:** `app/api/payments/verify/route.ts`

**검증 플로우:**

1. 포트원 API로 결제 정보 조회
2. 주문 정보에서 우편번호 추출
3. 서버에서 배송비 재계산
4. 계산된 최종 금액과 PG사 결제 금액 비교
5. 금액 일치 시 주문 완료 처리

**주요 변경사항:**

```typescript
// 배송비 재계산
const recalculatedShippingFee = await recalculateShippingFeeForValidation(
  productAmount,
  zipcode
);

// 최종 금액 계산
const expectedTotalAmount =
  productAmount + recalculatedShippingFee - couponDiscount - pointsUsed;

// 금액 검증
if (Math.abs(expectedTotalAmount - paidAmount) > 1) {
  return NextResponse.json(
    { error: "결제 금액이 일치하지 않습니다." },
    { status: 400 }
  );
}
```

### 6. React Hook (useShippingFee) ✅

**파일 위치:** `hooks/useShippingFee.ts`

**사용 예시:**

```typescript
"use client";

import { useShippingFee } from "@/hooks/useShippingFee";

function CheckoutPage() {
  const [orderAmount, setOrderAmount] = useState(50000);
  const [zipcode, setZipcode] = useState("63000");

  const { shippingFee, isLoading, error } = useShippingFee({
    orderAmount,
    zipcode,
    enabled: true,
  });

  return (
    <div>
      {isLoading && <p>배송비 계산 중...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {shippingFee && (
        <p>배송비: {shippingFee.totalShippingFee.toLocaleString()}원</p>
      )}
    </div>
  );
}
```

### 7. 프론트엔드 컴포넌트 ✅

#### ShippingAddressForm

**파일 위치:** `components/ShippingAddressForm.tsx`

주소 입력 및 실시간 배송비 계산 컴포넌트

```typescript
<ShippingAddressForm
  orderAmount={50000}
  onShippingFeeChange={(fee) => setShippingFee(fee)}
  onAddressChange={(address) => setAddress(address)}
/>
```

#### CheckoutShippingFeeSection

**파일 위치:** `components/CheckoutShippingFeeSection.tsx`

배송비 표시 전용 컴포넌트 (기존 주소 선택 방식 사용 시)

```typescript
<CheckoutShippingFeeSection
  orderAmount={50000}
  zipcode={zipcode}
  onShippingFeeChange={(fee) => setShippingFee(fee)}
/>
```

## 체크아웃 페이지 통합 방법

### 기존 checkout/page.tsx 수정 가이드

**1. 상태 추가:**

```typescript
const [shippingFee, setShippingFee] = useState(0);
const [zipcode, setZipcode] = useState("");
```

**2. 배송지 선택/입력 시 우편번호 업데이트:**

```typescript
// 기존 주소 선택 시
const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
if (selectedAddress) {
  setZipcode(selectedAddress.postal_code);
}

// 또는 새 주소 입력 시
<ShippingAddressForm
  orderAmount={getTotalPrice()}
  onShippingFeeChange={setShippingFee}
  onAddressChange={(addr) => setZipcode(addr.zipcode)}
/>;
```

**3. 최종 금액 계산에 배송비 포함:**

```typescript
const calculateFinalPrice = () => {
  const total = getTotalPrice(); // 상품 금액
  const couponDiscount = calculateDiscount();
  const pointDiscount = usePoints;

  // 배송비 포함!
  return Math.max(0, total + shippingFee - couponDiscount - pointDiscount);
};
```

**4. 결제 금액 표시:**

```typescript
<div className="space-y-2">
  <div className="flex justify-between">
    <span>상품 금액</span>
    <span>{getTotalPrice().toLocaleString()}원</span>
  </div>

  <div className="flex justify-between">
    <span>배송비</span>
    <span className="text-blue-600">+{shippingFee.toLocaleString()}원</span>
  </div>

  <div className="flex justify-between font-bold text-xl">
    <span>최종 결제 금액</span>
    <span>{calculateFinalPrice().toLocaleString()}원</span>
  </div>
</div>
```

**5. 주문 생성 시 배송비 포함:**

```typescript
const order = await createOrderMutation.mutateAsync({
  user_email: customerEmail,
  user_name: customerName,
  shipping_fee: shippingFee, // 배송비 추가
  coupon_discount: calculateDiscount(),
  points_used: usePoints,
  total_amount: calculateFinalPrice(),
  zipcode: zipcode, // 검증용
  // ... 기타 필드
});
```

**6. 포트원 결제 요청에 배송비 포함:**

```typescript
const response = await PortOne.requestPayment({
  storeId: storeId,
  paymentId: orderId,
  orderName: orderName,
  totalAmount: calculateFinalPrice(), // 배송비 포함 최종 금액
  // ...
});
```

## 예시 응답 샘플

### 일반 지역 (기본 배송비만)

```json
{
  "orderAmount": 30000,
  "zipcode": "06000",
  "result": {
    "baseShippingFee": 3000,
    "additionalFee": 0,
    "totalShippingFee": 3000,
    "isFreeShipping": false,
    "message": "3,000원 - 20,000원 더 구매 시 무료배송"
  }
}
```

### 제주 지역 (무료배송 조건 충족, 추가 배송비만)

```json
{
  "orderAmount": 60000,
  "zipcode": "63000",
  "result": {
    "baseShippingFee": 3000,
    "additionalFee": 3000,
    "totalShippingFee": 3000,
    "isFreeShipping": true,
    "message": "무료배송 (제주 추가 배송비 3,000원)"
  }
}
```

### 도서산간 지역 (추가 배송비 높음)

```json
{
  "orderAmount": 40000,
  "zipcode": "40200",
  "result": {
    "baseShippingFee": 3000,
    "additionalFee": 5000,
    "totalShippingFee": 8000,
    "isFreeShipping": false,
    "message": "8,000원 (울릉군 추가 배송비 포함) - 10,000원 더 구매 시 기본 배송비 무료"
  }
}
```

## 추가 우편번호 데이터 관리

### DB에 직접 추가

```sql
INSERT INTO mountain_zipcodes (zipcode, region_name, region_type, additional_fee)
VALUES ('12345', '특정 도서지역', 'mountain', 5000);
```

### 대량 업로드

```typescript
// 관리자 페이지에서 CSV/JSON 업로드 기능 구현 권장
import mountainZipcodes from "@/data/mountain-zipcodes.sample.json";

for (const region of mountainZipcodes.regions.mountain.regions) {
  for (const zipcode of region.zipcodes) {
    await supabase.from("mountain_zipcodes").insert({
      zipcode: zipcode.zipcode,
      region_name: zipcode.region_name,
      region_type: "mountain",
      additional_fee: 5000,
    });
  }
}
```

## 테스트 시나리오

### 1. 일반 배송 테스트

- 우편번호: `06000` (서울)
- 주문 금액: `30,000원`
- 예상 배송비: `3,000원`

### 2. 무료배송 테스트

- 우편번호: `06000` (서울)
- 주문 금액: `50,000원`
- 예상 배송비: `0원`

### 3. 제주 추가 배송비 테스트

- 우편번호: `63000` (제주)
- 주문 금액: `30,000원`
- 예상 배송비: `6,000원` (기본 3,000 + 제주 3,000)

### 4. 제주 무료배송 테스트

- 우편번호: `63000` (제주)
- 주문 금액: `50,000원`
- 예상 배송비: `3,000원` (제주 추가 배송비만)

### 5. 도서산간 테스트

- 우편번호: `40200` (울릉도)
- 주문 금액: `30,000원`
- 예상 배송비: `8,000원` (기본 3,000 + 도서산간 5,000)

## 주의사항

1. **우편번호 검증**: 결제 전 반드시 우편번호가 입력되었는지 확인
2. **금액 검증**: 백엔드에서 반드시 배송비 재계산 및 금액 검증 필수
3. **DB 데이터**: 우편번호 데이터는 주기적으로 업데이트 필요
4. **에러 처리**: 배송비 계산 실패 시 기본값 처리 로직 필요
5. **캐싱**: 배송비 설정은 자주 변경되지 않으므로 캐싱 권장

## 배포 체크리스트

- [ ] DB 마이그레이션 실행
- [ ] 배송비 설정 확인 (shipping_settings 테이블)
- [ ] 우편번호 데이터 삽입 (mountain_zipcodes 테이블)
- [ ] API 엔드포인트 테스트
- [ ] 체크아웃 페이지 통합
- [ ] 결제 검증 로직 테스트
- [ ] 실제 결제 테스트 (테스트 결제)
- [ ] 제주/도서산간 실제 우편번호로 테스트

## 참고 자료

- `examples/checkout-with-shipping-fee.example.tsx`: 체크아웃 페이지 통합 예시
- `data/mountain-zipcodes.sample.json`: 우편번호 샘플 데이터
- `types/shipping.types.ts`: TypeScript 타입 정의

## 문의 및 지원

구현 중 문제가 발생하면 다음 파일들을 확인하세요:

- DB 스키마: `supabase/migrations/20250122_shipping_fee_setup.sql`
- 배송비 계산 로직: `lib/shipping/calculate-shipping-fee.ts`
- API 엔드포인트: `app/api/shipping/calculate/route.ts`
- 결제 검증: `app/api/payments/verify/route.ts`
