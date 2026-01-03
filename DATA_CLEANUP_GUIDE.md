# 기존 잘못된 데이터 안전하게 제거하기

## 📋 개요

카카오 재가입 문제를 해결하기 전에, 기존 DB에 있는 잘못된 데이터를 안전하게 정리합니다.

### 제거 대상 데이터

1. **고아 레코드 (Orphaned Records)**
   - `auth.users`는 없지만 `user_profiles`만 남아있는 경우
   - `user_profiles`는 없지만 하위 데이터만 남아있는 경우

2. **중복 데이터**
   - 같은 이메일로 여러 `user_profiles`가 생성된 경우 (최신 것만 유지)

3. **무결성 위반 데이터**
   - 외래키 제약을 위반하는 데이터

---

## ⚠️ 중요 주의사항

### 실행 전 필수 체크리스트

- [ ] **DB 백업 완료** (가장 중요!)
- [ ] 점검 시간대 선택 (사용자가 적은 시간)
- [ ] 검증 SQL 먼저 실행하여 삭제될 데이터 확인
- [ ] 삭제될 데이터가 중요하지 않은지 확인
- [ ] 팀원들에게 작업 공지

### 영향받지 않는 데이터

✅ 다음 데이터는 **절대 삭제되지 않습니다**:

- **주문 데이터** (`orders`) - `ON DELETE SET NULL`로 보호됨
- **주문 건강상담** (`order_health_consultation`) - `ON DELETE SET NULL`로 보호됨
- 유효한 `auth.users`를 가진 모든 사용자 데이터

---

## 📝 실행 순서

### STEP 1: 데이터 무결성 검증

먼저 현재 DB 상태를 점검합니다:

```bash
# 방법 1: psql 사용
psql -f supabase/migrations/20260103_verify_data_integrity.sql

# 방법 2: Supabase CLI 사용 (로컬)
npx supabase db execute -f supabase/migrations/20260103_verify_data_integrity.sql
```

**출력 확인:**
```
===========================================
데이터 무결성 검증 결과
===========================================
고아 user_profiles: 3
고아 user_points: 2
중복 이메일: 1
유효하지 않은 주문 user_id: 0
===========================================
```

> 💡 **고아 레코드가 0개이고 중복 이메일이 0개라면 정리가 필요 없습니다!**

---

### STEP 2: 삭제될 데이터 확인 (READ-ONLY)

정리 SQL의 **STEP 1 부분만** 실행하여 삭제될 데이터를 미리 확인합니다:

```bash
# STEP 1만 복사하여 별도로 실행 (READ-ONLY 쿼리만)
psql -c "
SELECT
  '고아 user_profiles' as issue_type,
  up.user_id,
  up.email,
  up.display_name,
  up.created_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL
ORDER BY up.created_at DESC;
"
```

**결과 예시:**
```
 issue_type        | user_id                              | email              | display_name | created_at
-------------------+--------------------------------------+--------------------+--------------+---------------------------
 고아 user_profiles | a1b2c3d4-...                         | old@example.com    | 홍길동       | 2025-12-20 10:30:00+00
 고아 user_profiles | e5f6g7h8-...                         | test@kakao.com     | NULL         | 2025-12-15 08:20:00+00
```

> ⚠️ **이 데이터들이 삭제됩니다. 중요한 데이터가 있는지 확인하세요!**

---

### STEP 3: 백업 생성 (선택사항, 강력 권장)

```sql
-- 백업 테이블 생성
CREATE TABLE user_profiles_backup_20260103 AS
SELECT * FROM user_profiles;

CREATE TABLE user_points_backup_20260103 AS
SELECT * FROM user_points;

CREATE TABLE point_history_backup_20260103 AS
SELECT * FROM point_history;
```

**백업 확인:**
```sql
SELECT COUNT(*) FROM user_profiles_backup_20260103;
SELECT COUNT(*) FROM user_points_backup_20260103;
```

---

### STEP 4: 잘못된 데이터 정리 실행

⚠️ **이제 실제 삭제가 진행됩니다!**

```bash
# 전체 정리 스크립트 실행
psql -f supabase/migrations/20260103_cleanup_orphaned_data.sql
```

**실행 중 로그 예시:**
```
NOTICE:  === 중복 이메일 정리 시작 ===
NOTICE:    - 이메일 test@kakao.com : 1 개 중복 레코드 삭제
NOTICE:  === 총 1 개 중복 레코드 삭제 완료 ===
NOTICE:  === 고아 레코드 정리 시작 ===
NOTICE:    - point_history: 2 개 삭제
NOTICE:    - user_coupons: 0 개 삭제
NOTICE:    - shipping_addresses: 1 개 삭제
NOTICE:    - user_health_consultations: 0 개 삭제
NOTICE:    - user_health_profiles: 0 개 삭제
NOTICE:    - user_points: 2 개 삭제
NOTICE:    - user_profiles: 3 개 삭제
NOTICE:  === 고아 레코드 정리 완료 ===
```

---

### STEP 5: 정리 후 검증

정리가 완료되면 자동으로 검증이 실행됩니다:

```
 check_type                 | count
----------------------------+-------
 검증: 고아 user_profiles    | 0
 검증: 중복 이메일           | 0
 검증: 전체 user_profiles    | 150
```

**모든 count가 0이어야 정상입니다!** (전체 user_profiles 제외)

---

### STEP 6: 다시 무결성 검증

```bash
psql -f supabase/migrations/20260103_verify_data_integrity.sql
```

**기대 결과:**
```
===========================================
데이터 무결성 검증 결과
===========================================
고아 user_profiles: 0
고아 user_points: 0
중복 이메일: 0
유효하지 않은 주문 user_id: 0
===========================================
✅ 데이터 무결성 문제가 발견되지 않았습니다.
```

---

## 🔄 롤백 방법 (문제 발생 시)

### 백업에서 복원

```sql
BEGIN;

-- 기존 데이터 삭제
TRUNCATE user_profiles CASCADE;
TRUNCATE user_points CASCADE;
TRUNCATE point_history CASCADE;

-- 백업에서 복원
INSERT INTO user_profiles SELECT * FROM user_profiles_backup_20260103;
INSERT INTO user_points SELECT * FROM user_points_backup_20260103;
INSERT INTO point_history SELECT * FROM point_history_backup_20260103;

COMMIT;
```

### 백업 테이블 삭제 (정리 성공 확인 후)

```sql
DROP TABLE IF EXISTS user_profiles_backup_20260103;
DROP TABLE IF EXISTS user_points_backup_20260103;
DROP TABLE IF EXISTS point_history_backup_20260103;
```

---

## 📊 삭제되는 데이터 범위

### 자동으로 CASCADE 삭제되는 데이터

`user_profiles`가 삭제되면 다음 데이터도 자동으로 삭제됩니다:

- `shipping_addresses` (배송지)
- `user_points` (포인트)
- `point_history` (포인트 내역)
- `user_coupons` (쿠폰)

### 보존되는 데이터

다음 데이터는 **절대 삭제되지 않습니다**:

- `orders` - user_id가 NULL로 변경됨 (주문 데이터 보존)
- `order_health_consultation` - user_id가 NULL로 변경됨

---

## 🎯 다음 단계

데이터 정리가 완료되면:

1. ✅ `20260103_fix_kakao_rejoin_issue.sql` 마이그레이션 적용
2. ✅ `user_profiles.email` UNIQUE 제약 추가
3. ✅ 카카오 재가입 테스트

---

## 📞 문제 발생 시

### 자주 발생하는 문제

**Q1. "UNIQUE 제약 위반" 에러가 발생합니다**
- A: STEP 3의 중복 이메일 정리를 먼저 실행하세요

**Q2. "외래키 제약 위반" 에러가 발생합니다**
- A: 삭제 순서가 잘못되었을 수 있습니다. 스크립트를 순서대로 실행하세요

**Q3. 주문 데이터가 삭제되었습니다**
- A: 이는 발생하면 안 됩니다! 즉시 백업에서 복원하고 개발팀에 문의하세요

**Q4. 백업을 만들지 않았는데 롤백이 필요합니다**
- A: Supabase 대시보드의 Point-in-Time Recovery (PITR) 기능을 사용하세요

---

## ✅ 체크리스트

정리 완료 후 다음을 확인하세요:

- [ ] 고아 user_profiles: 0개
- [ ] 고아 user_points: 0개
- [ ] 중복 이메일: 0개
- [ ] 주문 데이터 개수 변화 없음
- [ ] auth.users와 user_profiles 개수 일치
- [ ] 백업 테이블 생성 확인
- [ ] 카카오 재가입 테스트 성공
