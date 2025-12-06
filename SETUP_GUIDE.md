# 🛍️ 쇼핑몰 고급 기능 설정 가이드

## 📋 구현된 기능

### ✅ 완료된 기능

1. **회원 인증 시스템**

   - 이메일/비밀번호 로그인
   - 회원가입
   - Google OAuth 로그인 준비
   - 로그아웃

2. **데이터베이스 스키마**

   - 사용자 프로필
   - 배송지 관리
   - 포인트 시스템
   - 쿠폰 시스템

3. **TypeScript 타입 정의**
   - 모든 새로운 기능에 대한 타입 추가

## 🚀 Supabase 설정 방법

### 1. SQL 스키마 실행

Supabase 대시보드에서 SQL Editor를 열고 다음 파일들을 순서대로 실행하세요:

```sql
-- 1. 기존 스키마 (이미 실행했다면 스킵)
supabase/schema.sql

-- 2. 위시리스트 스키마 (이미 실행했다면 스킵)
supabase/wishlist_schema.sql

-- 3. ⭐ 새로운 인증 및 보상 시스템 스키마
supabase/auth_and_rewards_schema.sql
```

### 2. Google OAuth 설정 (선택사항)

1. Supabase 대시보드 → Authentication → Providers → Google
2. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
3. Authorized redirect URIs에 Supabase 콜백 URL 추가:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
4. Client ID와 Client Secret을 Supabase에 입력

### 3. 환경 변수 확인

`.env.local` 파일이 다음 변수들을 포함하는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📱 사용 가능한 새로운 페이지

### 인증 관련

- `/auth/login` - 로그인 페이지
- `/auth/signup` - 회원가입 페이지

## 🔜 다음 단계 (구현 예정)

### 1. 포인트 시스템

- [ ] 포인트 내역 페이지 (`/profile/points`)
- [ ] 주문 완료 시 자동 포인트 적립
- [ ] 리뷰 작성 시 포인트 지급
- [ ] 결제 시 포인트 사용 기능

### 2. 쿠폰 시스템

- [ ] 쿠폰 센터 페이지 (`/coupons`)
- [ ] 쿠폰 다운로드 기능
- [ ] 결제 시 쿠폰 적용

### 4. 프로필 관리

- [ ] 사용자 프로필 편집
- [ ] 배송지 관리 (추가/수정/삭제)
- [ ] 주문 내역 조회

## 🧪 테스트 계정

SQL 스키마를 실행한 후, 다음 테스트 쿠폰이 자동으로 생성됩니다:

| 쿠폰 코드 | 할인    | 최소 구매금액 | 설명                |
| --------- | ------- | ------------- | ------------------- |
| WELCOME10 | 10%     | 0원           | 신규 회원 환영 쿠폰 |
| SALE5000  | 5,000원 | 30,000원      | 3만원 이상 구매 시  |
| VIP20     | 20%     | 50,000원      | VIP 회원 전용       |

## 📊 데이터베이스 구조

### 주요 테이블

1. **user_profiles** - 사용자 프로필

   - 이름, 전화번호 등 추가 정보

2. **shipping_addresses** - 배송지

   - 여러 배송지 저장 가능
   - 기본 배송지 설정

3. **user_points** - 사용자 포인트

   - 보유 포인트
   - 총 적립/사용 내역

4. **point_history** - 포인트 내역

   - 적립/사용 이력
   - 사유 기록

5. **coupons** - 쿠폰

   - 할인 타입 (퍼센트/정액)
   - 최소 구매금액
   - 유효기간

6. **user_coupons** - 사용자 보유 쿠폰
   - 다운로드한 쿠폰
   - 사용 여부

## 🎨 UI/UX 개선사항

- 로그인/회원가입 페이지 디자인
- Google 소셜 로그인 버튼
- 깔끔한 폼 레이아웃
- 에러 메시지 표시
- 로딩 상태 처리

## 🔐 보안 기능

- Row Level Security (RLS) 적용
- 사용자별 데이터 격리
- SQL Injection 방지
- 안전한 비밀번호 저장 (Supabase Auth)

## 💡 주요 함수

### 포인트 관련

```sql
-- 포인트 적립
SELECT add_points(
  'user-uuid',
  1000,
  '구매 적립',
  'order-uuid'
);

-- 포인트 사용
SELECT use_points(
  'user-uuid',
  500,
  '상품 구매 시 사용',
  'order-uuid'
);
```

## 🐛 트러블슈팅

### 로그인이 안 돼요

1. Supabase SQL 스키마가 올바르게 실행되었는지 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. 이메일 확인 필요 여부 체크 (Supabase 설정)

### 쿠폰이 보이지 않아요

1. `auth_and_rewards_schema.sql` 실행 확인
2. Supabase 대시보드에서 coupons 테이블 확인
3. is_active가 true인지 확인

### Google 로그인이 안 돼요

1. Supabase OAuth 설정 확인
2. Google Cloud Console 설정 확인
3. Redirect URI 정확히 입력 확인

## 📞 다음 작업

아직 구현해야 할 기능들이 남아있습니다. 계속 진행하시려면 알려주세요!

1. **포인트 페이지 구현**
2. **쿠폰 센터 구현**
3. **결제 페이지에 포인트/쿠폰 연동**

## 🎯 예상 완료 시간

- 포인트 시스템: 1-2시간
- 쿠폰 시스템: 1-2시간
- 통합 테스트: 1시간

**총 예상 시간**: 5-8시간
