-- ============================================================================
-- 카카오 재가입 문제 해결
--
-- 문제: 탈퇴 후 재가입 시 고아 레코드(orphaned records)로 인한 에러 발생
-- 해결:
--   1. 고아 레코드 정리 (auth.users 없는 user_profiles 삭제)
--   2. user_profiles.email에 UNIQUE 제약 추가
--   3. 중복 이메일 처리 로직 추가
-- ============================================================================

BEGIN;

-- 1. 고아 레코드 정리: auth.users에 없는 user_profiles 삭제
DO $$
DECLARE
  orphan_record RECORD;
  deleted_count INTEGER := 0;
BEGIN
  FOR orphan_record IN
    SELECT up.user_id, up.email
    FROM user_profiles up
    LEFT JOIN auth.users au ON up.user_id = au.id
    WHERE au.id IS NULL
  LOOP
    -- user_points도 함께 삭제
    DELETE FROM user_points WHERE user_id = orphan_record.user_id;

    -- user_profiles 삭제
    DELETE FROM user_profiles WHERE user_id = orphan_record.user_id;

    deleted_count := deleted_count + 1;
    RAISE NOTICE 'Deleted orphaned profile: user_id=%, email=%', orphan_record.user_id, orphan_record.email;
  END LOOP;

  RAISE NOTICE 'Total orphaned records cleaned: %', deleted_count;
END $$;

-- 2. 중복 이메일 처리: 같은 이메일이 여러 개 있는 경우 가장 최근 것만 남기고 삭제
DO $$
DECLARE
  duplicate_email VARCHAR(255);
  duplicate_count INTEGER := 0;
BEGIN
  FOR duplicate_email IN
    SELECT email
    FROM user_profiles
    GROUP BY email
    HAVING COUNT(*) > 1
  LOOP
    -- 해당 이메일의 가장 최근 레코드를 제외하고 모두 삭제
    WITH ranked_profiles AS (
      SELECT user_id,
             ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
      FROM user_profiles
      WHERE email = duplicate_email
    )
    DELETE FROM user_profiles
    WHERE user_id IN (
      SELECT user_id FROM ranked_profiles WHERE rn > 1
    );

    duplicate_count := duplicate_count + 1;
    RAISE NOTICE 'Cleaned duplicate email: %', duplicate_email;
  END LOOP;

  RAISE NOTICE 'Total duplicate emails cleaned: %', duplicate_count;
END $$;

-- 3. user_profiles.email에 UNIQUE 제약 추가
-- 먼저 기존 제약이 있는지 확인하고 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_email_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
    RAISE NOTICE 'Added UNIQUE constraint on user_profiles.email';
  ELSE
    RAISE NOTICE 'UNIQUE constraint on user_profiles.email already exists';
  END IF;
END $$;

-- 4. 인덱스 최적화 (이미 있으면 무시됨)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_lower ON user_profiles(LOWER(email));

COMMIT;

-- 롤백용 SQL (필요시 사용)
-- BEGIN;
-- ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_email_key;
-- DROP INDEX IF EXISTS idx_user_profiles_email_lower;
-- COMMIT;
