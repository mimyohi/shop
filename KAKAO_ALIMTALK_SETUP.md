# 카카오톡 알림톡 설정 가이드

이 가이드는 Solapi를 통해 카카오톡 알림톡 서비스를 설정하는 방법을 안내합니다.

## 개요

- **SMS/이메일 대체**: 기존 SMS와 이메일 알림을 모두 카카오톡 알림톡으로 대체
- **서비스 제공**: Solapi
- **사용 용도**:
  - OTP 인증번호 발송
  - 주문 확인 알림
  - 배송 시작 알림
  - 주문 취소 알림

## 1. Solapi 계정 생성 및 설정

### 1.1 Solapi 가입

1. [Solapi 웹사이트](https://solapi.com)에 접속
2. 회원가입 진행
3. 본인인증 완료

### 1.2 API Key 발급

1. 로그인 후 [대시보드](https://console.solapi.com) 접속
2. **설정** → **API Key 관리** 메뉴 클릭
3. **새 API Key 생성** 클릭
4. API Key와 API Secret을 안전한 곳에 저장

### 1.3 충전

1. **충전** 메뉴 클릭
2. 최소 5만원 이상 충전 권장
3. 알림톡 단가: 약 8원/건 (2024년 기준)

## 2. 카카오톡 채널 생성

### 2.1 카카오톡 채널 관리자 센터 접속

1. [카카오톡 채널 관리자 센터](https://center-pf.kakao.com) 접속
2. 카카오 계정으로 로그인

### 2.2 채널 생성

1. **새 채널 만들기** 클릭
2. 채널 정보 입력:
   - 채널명: 쇼핑몰 이름
   - 채널 아이디: 고유한 영문 ID (변경 불가)
   - 카테고리: 쇼핑/유통 선택
3. **만들기** 클릭

### 2.3 채널 공개 설정

1. **관리** → **상세 설정** 메뉴
2. **공개 설정**을 **공개**로 변경
3. 검색 허용 설정

## 3. Solapi와 카카오톡 채널 연동

### 3.1 카카오톡 채널 인증

1. Solapi 콘솔 → **메시지** → **카카오톡** 메뉴
2. **카카오톡 채널 추가** 클릭
3. 카카오 계정 로그인 및 채널 선택
4. 권한 동의 후 연동 완료

### 3.2 발신 프로필 키 확인

1. 연동 완료 후 **카카오톡 채널 목록**에서 발신 프로필 키 확인
2. 발신 프로필 키를 `.env.local` 파일의 `KAKAO_SENDER_KEY`에 저장

## 4. 알림톡 템플릿 등록

알림톡은 사전에 등록하고 승인받은 템플릿만 사용할 수 있습니다.

### 4.1 템플릿 등록 방법

1. Solapi 콘솔 → **메시지** → **카카오톡** → **템플릿 관리**
2. **템플릿 추가** 클릭
3. 템플릿 정보 입력

### 4.2 필수 템플릿 목록

#### 템플릿 1: OTP 인증번호 (otp_auth)

```
[쇼핑몰] 인증번호 안내

안녕하세요. 쇼핑몰입니다.
본인 확인을 위한 인증번호를 안내해 드립니다.

인증번호: #{OTP}
유효시간: 5분

감사합니다.
```

**템플릿 코드**: `otp_auth`
**변수**: `#{OTP}` (6자리 숫자)

---

#### 템플릿 2: 주문 확인 (order_confirmation)

```
[쇼핑몰] 주문이 완료되었습니다

#{고객명}님, 주문해 주셔서 감사합니다.

주문번호: #{주문번호}
상품명: #{상품명}
결제금액: #{결제금액}

주문 내역은 마이페이지에서 확인하실 수 있습니다.
```

**템플릿 코드**: `order_confirmation`
**변수**:

- `#{고객명}`: 고객 이름
- `#{주문번호}`: 주문 번호
- `#{상품명}`: 상품명 (예: "상품A 외 2건")
- `#{결제금액}`: 결제 금액

---

#### 템플릿 3: 배송 시작 (shipping_notification)

```
[쇼핑몰] 상품이 발송되었습니다

#{고객명}님, 주문하신 상품이 발송되었습니다.

주문번호: #{주문번호}
택배사: #{택배사}
송장번호: #{송장번호}

배송 조회는 택배사 웹사이트에서 확인하실 수 있습니다.
```

**템플릿 코드**: `shipping_notification`
**변수**:

- `#{고객명}`: 고객 이름
- `#{주문번호}`: 주문 번호
- `#{택배사}`: 택배사명
- `#{송장번호}`: 송장번호

---

#### 템플릿 4: 주문 취소 (order_cancellation)

```
[쇼핑몰] 주문이 취소되었습니다

#{고객명}님, 주문이 취소되었습니다.

주문번호: #{주문번호}
환불금액: #{환불금액}
취소사유: #{취소사유}

환불은 영업일 기준 3-5일 내에 처리됩니다.
사용된 포인트 및 쿠폰은 자동으로 복구됩니다.
```

**템플릿 코드**: `order_cancellation`
**변수**:

- `#{고객명}`: 고객 이름
- `#{주문번호}`: 주문 번호
- `#{환불금액}`: 환불 금액
- `#{취소사유}`: 취소 사유

### 4.3 템플릿 승인

1. 템플릿 등록 후 **검수 요청** 클릭
2. 카카오 검수 대기 (보통 1-2 영업일 소요)
3. 승인 완료 후 사용 가능

## 5. 환경 변수 설정

### 5.1 `.env.local` 파일 생성/수정

프로젝트 루트의 `.env.local` 파일에 다음 내용 추가:

```env
# Solapi (카카오톡 알림톡 및 SMS)
SOLAPI_API_KEY=your_solapi_api_key
SOLAPI_API_SECRET=your_solapi_api_secret

# 카카오톡 알림톡 설정
KAKAO_SENDER_KEY=your_kakao_sender_key

# 카카오톡 알림톡 템플릿 코드
KAKAO_TEMPLATE_OTP=otp_auth
KAKAO_TEMPLATE_ORDER_CONFIRM=order_confirmation
KAKAO_TEMPLATE_SHIPPING=shipping_notification
KAKAO_TEMPLATE_CANCEL=order_cancellation
```

**값 채우기:**

- `SOLAPI_API_KEY`: Solapi API Key
- `SOLAPI_API_SECRET`: Solapi API Secret
- `KAKAO_SENDER_KEY`: 카카오톡 채널의 발신 프로필 키
- `KAKAO_TEMPLATE_*`: 등록한 템플릿의 코드 (위 예시와 동일하게 사용)

### 5.2 Solapi sendManyDetail API 요청 구조

- 공식 레퍼런스: [메시지 발송 API](https://developers.solapi.com/references/messages/sendManyDetail)
- 엔드포인트: `POST https://api.solapi.com/messages/v4/send-many/detail`
- 인증 헤더: `Authorization: HMAC-SHA256 apiKey=<API_KEY>, date=<ISO8601>, salt=<RANDOM>, signature=<HMAC>`
  - `date`: 현재 시간을 ISO 8601 형식 (`new Date().toISOString()`)
  - `salt`: 매 요청마다 새로 생성하는 12~64 byte 랜덤 문자열
  - `signature`: `(date + salt)`를 데이터로, `SOLAPI_API_SECRET`을 키로 한 HMAC-SHA256 해시값
  - Solapi 서버 시간이 기준이므로 ±15분 이내의 `date` 값과 매번 다른 `salt`를 사용해야 합니다. 자세한 규칙은 [API Key 인증 방식 문서](https://developers.solapi.com/references/authentication/api-key)를 참고하세요.
- 요청 본문 예시:

```json
{
  "messages": [
    {
      "to": "821012345678",
      "type": "ATA",
      "kakaoOptions": {
        "senderKey": "KAKAO_SENDER_KEY",
        "templateCode": "order_confirmation",
        "disableSms": true,
        "variables": {
          "#{고객명}": "홍길동",
          "#{주문번호}": "ORDER-12345",
          "#{결제금액}": "15,000원"
        }
      }
    }
  ],
  "allowDuplicates": false
}
```

- `kakaoOptions.senderKey`와 `kakaoOptions.templateCode`는 각각 발신 프로필 키와 승인된 템플릿 코드를 사용합니다.
- `kakaoOptions.disableSms`를 `true`로 두면 알림톡 발송 실패 시 SMS/LMS로 대체 발송되지 않습니다.
- 응답은 `failedMessageList`와 `groupInfo`를 포함하며, `groupInfo.groupId` 값이 발송 그룹 식별자입니다. 오류가 있을 경우 `failedMessageList` 항목을 참고하여 원인을 빠르게 파악할 수 있습니다.

## 6. 테스트

### 6.1 개발 서버 실행

```bash
npm run dev
```

### 6.2 OTP 인증 테스트

1. 브라우저에서 `http://localhost:3000/auth/phone-login` 접속
2. 전화번호 입력 후 **인증번호 받기** 클릭
3. 카카오톡으로 인증번호 수신 확인

### 6.3 주문 알림 테스트

1. 테스트 주문 생성
2. 결제 완료 후 카카오톡으로 주문 확인 알림 수신 확인
3. 관리자 페이지에서 배송 정보 입력 후 배송 알림 수신 확인

## 7. 문제 해결

### 7.1 "발신 프로필 키가 설정되지 않았습니다" 오류

- `.env.local` 파일에 `KAKAO_SENDER_KEY`가 올바르게 설정되어 있는지 확인
- 환경 변수 변경 후 개발 서버 재시작 필요

### 7.2 "알림톡 템플릿을 찾을 수 없습니다" 오류

- 템플릿이 카카오에서 승인되었는지 확인
- `.env.local`의 템플릿 코드가 실제 등록한 코드와 일치하는지 확인

### 7.3 "알림톡 잔액이 부족합니다" 오류

- Solapi 콘솔에서 잔액 확인 및 충전

### 7.4 개발 모드에서 실제 발송되지 않는 경우

- 개발 환경에서는 콘솔에만 출력되고 실제 발송되지 않습니다
- 실제 발송을 테스트하려면:
  1. `.env.local`에 Solapi 및 카카오톡 설정 완료
  2. `NODE_ENV=production`으로 설정하거나
  3. 프로덕션 환경에 배포하여 테스트

## 8. 비용 안내

### 8.1 알림톡 단가 (2024년 기준)

- 알림톡: 약 8원/건
- SMS (대체 발송 시): 약 12원/건
- LMS (장문 SMS): 약 30원/건

### 8.2 예상 비용

- OTP 발송: 8원/건
- 주문 알림: 8원/건
- 배송 알림: 8원/건
- 주문 취소: 8원/건

**월 1,000건 발송 시**: 약 8,000원

## 9. 추가 참고 사항

### 9.1 SMS 대체 발송 (Fallback)

- 알림톡 발송 실패 시 자동으로 SMS로 전환 가능
- Solapi 콘솔에서 대체 발송 설정 가능
- 추가 비용 발생 (SMS 단가 적용)

### 9.2 발송 시간

- 알림톡: 즉시 발송 (1-2초 내)
- 템플릿 변경 시 재승인 필요

### 9.3 개인정보 보호

- 전화번호는 E.164 형식으로 저장 권장 (예: +821012345678)
- 알림톡 발송 이력은 Solapi 콘솔에서 확인 가능
- 수신 거부 관리 필수

## 10. 추가 참고 자료

- [Solapi 공식 문서](https://docs.solapi.com)
- [카카오톡 채널 관리자 센터](https://center-pf.kakao.com)
- [카카오톡 비즈메시지 가이드](https://kakaobusiness.gitbook.io/main)

---

설정 완료 후 카카오톡 알림톡이 정상적으로 작동하면 이 문서는 완료입니다!
