# 카카오 재가입 문제 해결 가이드

## 문제 설명

카카오 로그인 사용자가 탈퇴 후 같은 카카오 계정으로 재가입 시도 시 다음과 같은 증상이 발생했습니다:

- 사용자에게 "로그인 중 오류가 발생했습니다." 에러 메시지 표시
- 회원가입은 실패하지만 DB에는 계정 데이터가 생성됨
- 이후 재시도 시 계속 실패

## 원인 분석

### 핵심 문제점

1. **고아 레코드(Orphaned Records) 발생**
   - 탈퇴 시 `auth.users`는 삭제되지만 `user_profiles`가 남아있는 경우 발생
   - 또는 OAuth 콜백 롤백 과정에서 `user_profiles`가 완전히 삭제되지 않음

2. **이메일 중복 체크 로직의 한계**
   - `user_profiles` 테이블의 `email` 컬럼에 UNIQUE 제약이 없어 중복 허용
   - 같은 이메일로 여러 프로필이 생성 가능

3. **롤백 처리의 불완전성**
   - 콜백에서 계정 삭제 시 `auth.users`만 삭제하고 CASCADE 의존
   - 트랜잭션이 완료되기 전에 리다이렉트되어 삭제가 완료되지 않을 수 있음

## 해결 방법

### 1. 코드 변경사항

#### ✅ app/auth/callback/route.ts
- 고아 레코드 자동 정리 로직 추가
- 롤백 시 `user_profiles`, `user_points` 명시적으로 삭제 후 `auth.users` 삭제
- 이메일 중복 체크 전에 고아 레코드 정리 수행

### 2. DB 마이그레이션

#### ✅ supabase/migrations/20260103_fix_kakao_rejoin_issue.sql
다음 작업을 수행합니다:
1. 고아 레코드 정리 (auth.users 없는 user_profiles 삭제)
2. 중복 이메일 정리 (가장 최근 것만 유지)
3. user_profiles.email에 UNIQUE 제약 추가
4. 대소문자 구분 없는 검색을 위한 인덱스 추가

#### ✅ supabase/migrations/20260103_add_email_unique_constraint_only.sql
이미 정리된 DB에 UNIQUE 제약만 추가하는 간단한 버전

### 3. 스키마 파일 업데이트

- `supabase/full_setup.sql` - user_profiles.email UNIQUE 제약 추가
- `supabase/schema.sql` - user_profiles.email UNIQUE 제약 추가

## 적용 방법

### 옵션 1: 전체 마이그레이션 (권장)

```bash
# 1. 마이그레이션 적용
npx supabase db push

# 2. 또는 특정 마이그레이션만 적용
npx supabase migration up 20260103_fix_kakao_rejoin_issue
```

### 옵션 2: 수동 적용

```bash
# 1. 고아 레코드와 중복 정리
psql -f supabase/migrations/20260103_fix_kakao_rejoin_issue.sql

# 2. UNIQUE 제약만 추가 (정리가 이미 완료된 경우)
psql -f supabase/migrations/20260103_add_email_unique_constraint_only.sql
```

## 테스트 시나리오

마이그레이션 적용 후 다음 시나리오를 테스트해주세요:

### 1. 카카오 재가입 테스트
1. 카카오로 회원가입
2. 회원 탈퇴
3. 같은 카카오 계정으로 재가입
4. ✅ 정상적으로 회원가입 완료되어야 함

### 2. 고아 레코드 정리 테스트
1. DB에서 수동으로 user_profiles만 남기고 auth.users 삭제
2. 해당 이메일로 카카오 로그인 시도
3. ✅ 고아 레코드가 자동으로 정리되고 로그인 성공해야 함

### 3. 이메일 중복 방지 테스트
1. 이메일 A로 일반 회원가입
2. 같은 이메일 A의 카카오 계정으로 로그인 시도
3. ✅ "이미 이메일로 가입된 계정이 있습니다" 에러 표시되어야 함

## 주의사항

⚠️ **운영 DB 적용 전 백업 필수**
- 마이그레이션은 데이터를 삭제할 수 있으므로 반드시 백업 후 진행

⚠️ **중복 이메일 처리**
- 마이그레이션은 중복 이메일 중 가장 최근 것만 유지
- 필요시 마이그레이션 전에 수동으로 데이터 정리

⚠️ **롤백 방법**
```sql
BEGIN;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_email_key;
DROP INDEX IF EXISTS idx_user_profiles_email_lower;
COMMIT;
```

## 사이드 이팩트 체크

### ✅ 확인된 안전성
- [x] TypeScript 타입 체크 통과
- [x] 기존 회원가입 플로우 영향 없음
- [x] 일반 로그인 영향 없음
- [x] 이메일 로그인 영향 없음
- [x] CASCADE 동작 보장 (ON DELETE CASCADE)

### ⚠️ 잠재적 영향
- user_profiles에 중복 이메일이 있으면 마이그레이션 실패 가능
  → 마이그레이션 스크립트에서 자동으로 정리함

## 문의

문제가 지속되거나 추가 질문이 있으면 개발팀에 문의해주세요.
