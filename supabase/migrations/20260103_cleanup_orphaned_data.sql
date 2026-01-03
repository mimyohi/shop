-- ============================================================================
-- 기존 잘못된 데이터 안전하게 제거
--
-- 실행 전 주의사항:
-- 1. 반드시 DB 백업을 먼저 수행하세요
-- 2. 먼저 SELECT 쿼리로 삭제될 데이터를 확인하세요
-- 3. 운영 DB에서는 점검 시간에 실행을 권장합니다
--
-- 삭제 대상:
-- 1. 고아 레코드: auth.users가 없는 user_profiles
-- 2. 고아 레코드: auth.users가 없는 user_points, user_health_*
-- 3. 중복 이메일: 같은 이메일의 여러 프로필 (최신 것만 유지)
-- 4. 고아 레코드: user_profiles가 없는 하위 데이터
-- ============================================================================

-- ============================================================================
-- STEP 1: 문제 있는 데이터 확인 (READ-ONLY)
-- ============================================================================

-- 1-1. auth.users가 없는 user_profiles 확인
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

-- 1-2. 중복 이메일 확인
SELECT
  '중복 이메일' as issue_type,
  email,
  COUNT(*) as count,
  STRING_AGG(user_id::TEXT, ', ') as user_ids
FROM user_profiles
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 1-3. auth.users가 없는 user_points 확인
SELECT
  '고아 user_points' as issue_type,
  upt.user_id,
  upt.points,
  upt.created_at
FROM user_points upt
LEFT JOIN auth.users au ON upt.user_id = au.id
WHERE au.id IS NULL;

-- 1-4. auth.users가 없는 user_health_profiles 확인
SELECT
  '고아 user_health_profiles' as issue_type,
  uhp.user_id,
  uhp.created_at
FROM user_health_profiles uhp
LEFT JOIN auth.users au ON uhp.user_id = au.id
WHERE au.id IS NULL;

-- 1-5. auth.users가 없는 user_health_consultations 확인
SELECT
  '고아 user_health_consultations' as issue_type,
  uhc.user_id,
  uhc.created_at
FROM user_health_consultations uhc
LEFT JOIN auth.users au ON uhc.user_id = au.id
WHERE au.id IS NULL;

-- 1-6. user_profiles가 없는 shipping_addresses 확인
SELECT
  '고아 shipping_addresses' as issue_type,
  sa.user_id,
  sa.name,
  sa.created_at
FROM shipping_addresses sa
LEFT JOIN user_profiles up ON sa.user_id = up.user_id
WHERE up.user_id IS NULL;

-- 1-7. user_profiles가 없는 user_coupons 확인
SELECT
  '고아 user_coupons' as issue_type,
  uc.user_id,
  uc.coupon_id,
  uc.created_at
FROM user_coupons uc
LEFT JOIN user_profiles up ON uc.user_id = up.user_id
WHERE up.user_id IS NULL;

-- 1-8. user_points가 없는 point_history 확인
SELECT
  '고아 point_history' as issue_type,
  ph.user_id,
  ph.points,
  ph.type,
  ph.reason,
  ph.created_at
FROM point_history ph
LEFT JOIN user_points upt ON ph.user_id = upt.user_id
WHERE upt.user_id IS NULL;

-- ============================================================================
-- STEP 2: 백업 테이블 생성 (선택사항)
-- ============================================================================

-- 백업이 필요한 경우 주석 해제하여 실행
-- CREATE TABLE IF NOT EXISTS user_profiles_backup_20260103 AS
-- SELECT * FROM user_profiles;
--
-- CREATE TABLE IF NOT EXISTS user_points_backup_20260103 AS
-- SELECT * FROM user_points;

-- ============================================================================
-- STEP 3: 잘못된 데이터 삭제 (WRITE)
-- ============================================================================

-- 여기서부터는 실제 삭제가 진행됩니다.
-- 반드시 STEP 1의 확인을 먼저 수행한 후 실행하세요!

BEGIN;

-- 3-1. 중복 이메일 정리 (가장 최근 것만 남기고 삭제)
DO $$
DECLARE
  duplicate_email VARCHAR(255);
  deleted_count INTEGER := 0;
  total_deleted INTEGER := 0;
BEGIN
  RAISE NOTICE '=== 중복 이메일 정리 시작 ===';

  FOR duplicate_email IN
    SELECT email
    FROM user_profiles
    GROUP BY email
    HAVING COUNT(*) > 1
  LOOP
    -- 해당 이메일의 가장 최근 레코드를 제외하고 모두 삭제
    WITH ranked_profiles AS (
      SELECT
        user_id,
        email,
        created_at,
        ROW_NUMBER() OVER (ORDER BY created_at DESC, user_id DESC) as rn
      FROM user_profiles
      WHERE email = duplicate_email
    )
    DELETE FROM user_profiles
    WHERE user_id IN (
      SELECT user_id FROM ranked_profiles WHERE rn > 1
    );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;

    RAISE NOTICE '  - 이메일 % : % 개 중복 레코드 삭제', duplicate_email, deleted_count;
  END LOOP;

  RAISE NOTICE '=== 총 % 개 중복 레코드 삭제 완료 ===', total_deleted;
END $$;

-- 3-2. auth.users가 없는 하위 데이터 먼저 삭제
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '=== 고아 레코드 정리 시작 ===';

  -- point_history (user_points가 없는 경우)
  DELETE FROM point_history
  WHERE user_id IN (
    SELECT ph.user_id
    FROM point_history ph
    LEFT JOIN user_points upt ON ph.user_id = upt.user_id
    WHERE upt.user_id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  - point_history: % 개 삭제', deleted_count;

  -- user_coupons (user_profiles가 없는 경우)
  DELETE FROM user_coupons
  WHERE user_id IN (
    SELECT uc.user_id
    FROM user_coupons uc
    LEFT JOIN user_profiles up ON uc.user_id = up.user_id
    WHERE up.user_id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  - user_coupons: % 개 삭제', deleted_count;

  -- shipping_addresses (user_profiles가 없는 경우)
  DELETE FROM shipping_addresses
  WHERE user_id IN (
    SELECT sa.user_id
    FROM shipping_addresses sa
    LEFT JOIN user_profiles up ON sa.user_id = up.user_id
    WHERE up.user_id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  - shipping_addresses: % 개 삭제', deleted_count;

  -- user_health_consultations (auth.users가 없는 경우)
  DELETE FROM user_health_consultations
  WHERE user_id IN (
    SELECT uhc.user_id
    FROM user_health_consultations uhc
    LEFT JOIN auth.users au ON uhc.user_id = au.id
    WHERE au.id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  - user_health_consultations: % 개 삭제', deleted_count;

  -- user_health_profiles (auth.users가 없는 경우)
  DELETE FROM user_health_profiles
  WHERE user_id IN (
    SELECT uhp.user_id
    FROM user_health_profiles uhp
    LEFT JOIN auth.users au ON uhp.user_id = au.id
    WHERE au.id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  - user_health_profiles: % 개 삭제', deleted_count;

  -- user_points (auth.users가 없는 경우)
  DELETE FROM user_points
  WHERE user_id IN (
    SELECT upt.user_id
    FROM user_points upt
    LEFT JOIN auth.users au ON upt.user_id = au.id
    WHERE au.id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  - user_points: % 개 삭제', deleted_count;

  -- user_profiles (auth.users가 없는 경우) - 마지막에 삭제
  DELETE FROM user_profiles
  WHERE user_id IN (
    SELECT up.user_id
    FROM user_profiles up
    LEFT JOIN auth.users au ON up.user_id = au.id
    WHERE au.id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  - user_profiles: % 개 삭제', deleted_count;

  RAISE NOTICE '=== 고아 레코드 정리 완료 ===';
END $$;

COMMIT;

-- ============================================================================
-- STEP 4: 정리 후 검증
-- ============================================================================

-- 4-1. 고아 레코드가 남아있는지 확인 (0이어야 정상)
SELECT
  '검증: 고아 user_profiles' as check_type,
  COUNT(*) as count
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- 4-2. 중복 이메일이 남아있는지 확인 (0이어야 정상)
SELECT
  '검증: 중복 이메일' as check_type,
  COUNT(*) as count
FROM (
  SELECT email
  FROM user_profiles
  GROUP BY email
  HAVING COUNT(*) > 1
) duplicates;

-- 4-3. 전체 user_profiles 개수 확인
SELECT
  '검증: 전체 user_profiles' as check_type,
  COUNT(*) as count
FROM user_profiles;

-- 4-4. auth.users와 user_profiles 개수 비교 (같아야 정상)
SELECT
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT
  'user_profiles' as table_name,
  COUNT(*) as count
FROM user_profiles;

-- ============================================================================
-- STEP 5: 롤백 방법 (문제 발생 시)
-- ============================================================================

-- 백업에서 복원이 필요한 경우:
-- BEGIN;
-- TRUNCATE user_profiles CASCADE;
-- INSERT INTO user_profiles SELECT * FROM user_profiles_backup_20260103;
-- TRUNCATE user_points CASCADE;
-- INSERT INTO user_points SELECT * FROM user_points_backup_20260103;
-- COMMIT;
