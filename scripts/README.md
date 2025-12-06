# 테스트 사용자 생성 스크립트

Supabase Auth를 사용하여 일반 사용자 테스트 계정을 자동으로 생성하는 스크립트입니다.

## 사용 방법

### 1. Service Role Key 준비

Supabase Dashboard에서 Service Role Key를 가져옵니다:

1. Supabase Dashboard 접속
2. Settings > API 메뉴로 이동
3. `service_role` key 복사

### 2. 스크립트 실행

#### 방법 1: 환경 변수 사용

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key npm run create-test-users
```

#### 방법 2: 인터랙티브 모드

```bash
npm run create-test-users
```

스크립트를 실행하면 Service Role Key를 입력하라는 프롬프트가 나타납니다.

### 3. 생성되는 계정

스크립트는 다음 3개의 테스트 계정을 생성합니다:

| 이메일 | 비밀번호 | 이름 | 전화번호 |
|--------|----------|------|----------|
| test1@example.com | test123!@# | 테스트유저1 | 010-1111-1111 |
| test2@example.com | test123!@# | 테스트유저2 | 010-2222-2222 |
| test3@example.com | test123!@# | 테스트유저3 | 010-3333-3333 |

각 계정은 다음과 같이 설정됩니다:

- ✅ 이메일 인증 자동 완료
- ✅ 사용자 프로필 생성 (user_profiles 테이블)
- ✅ 포인트 지갑 생성 및 웰컴 포인트 1,000 포인트 지급
- ✅ 즉시 로그인 가능

## 생성된 계정으로 로그인

쇼핑몰 사이트에서 위 계정 정보로 바로 로그인할 수 있습니다.

예시:
```
이메일: test1@example.com
비밀번호: test123!@#
```

## 문제 해결

### "User already exists" 오류

이미 해당 이메일로 계정이 존재하는 경우 발생합니다. Supabase Dashboard > Authentication > Users에서 기존 사용자를 삭제하거나, 스크립트의 `DEFAULT_TEST_USERS` 배열을 수정하여 다른 이메일을 사용하세요.

### "Invalid API key" 오류

Service Role Key가 잘못되었거나 만료된 경우입니다. Supabase Dashboard에서 올바른 key를 다시 복사하여 사용하세요.

### 프로필 또는 포인트 생성 실패

`auth_and_rewards_schema.sql`의 트리거 함수가 제대로 설정되어 있지 않을 수 있습니다. Supabase SQL Editor에서 해당 스키마를 다시 실행하세요.

## 커스터마이징

스크립트를 수정하여 다른 테스트 계정을 생성할 수 있습니다:

1. `scripts/create-test-users.js` 파일 열기
2. `DEFAULT_TEST_USERS` 배열 수정
3. 원하는 사용자 정보 추가/수정

```javascript
const DEFAULT_TEST_USERS = [
  {
    email: 'mytest@example.com',
    password: 'mypassword123',
    displayName: '나의테스트',
    phone: '010-9999-9999'
  },
  // 더 많은 사용자 추가...
];
```
