-- ============================================================================
-- 데이터 무결성 검증 SQL
--
-- 용도: 고아 레코드 정리 전후로 중요 데이터에 영향이 없는지 확인
-- 특히 주문(orders) 데이터는 ON DELETE SET NULL이므로 보존되어야 함
-- ============================================================================

-- ============================================================================
-- 1. 주문 데이터 무결성 확인
-- ============================================================================

-- 1-1. 전체 주문 개수
SELECT
  '전체 주문' as check_type,
  COUNT(*) as total_orders,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as orphaned_orders
FROM orders;

-- 1-2. user_id가 NULL인 주문 (탈퇴한 사용자의 주문)
SELECT
  'user_id가 NULL인 주문' as check_type,
  COUNT(*) as count,
  SUM(total_amount) as total_amount
FROM orders
WHERE user_id IS NULL;

-- 1-3. user_id가 있지만 auth.users에 없는 주문 (문제 상황)
SELECT
  'user_id 있지만 auth.users 없음' as check_type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT o.user_id::TEXT, ', ') as problematic_user_ids
FROM orders o
WHERE o.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = o.user_id
  );

-- 1-4. 최근 7일간 주문 통계 (데이터 보존 확인)
SELECT
  DATE(created_at) as order_date,
  COUNT(*) as order_count,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(total_amount) as daily_revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- ============================================================================
-- 2. 사용자 데이터 일관성 확인
-- ============================================================================

-- 2-1. auth.users와 user_profiles 개수 비교
WITH user_counts AS (
  SELECT 'auth.users' as source, COUNT(*) as count FROM auth.users
  UNION ALL
  SELECT 'user_profiles' as source, COUNT(*) as count FROM user_profiles
)
SELECT
  source,
  count,
  CASE
    WHEN source = 'user_profiles'
    THEN count - LAG(count) OVER (ORDER BY source)
    ELSE 0
  END as difference
FROM user_counts;

-- 2-2. user_profiles는 있지만 auth.users가 없는 경우 (고아 레코드)
SELECT
  'user_profiles 고아 레코드' as check_type,
  COUNT(*) as count,
  STRING_AGG(up.email, ', ') as emails
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- 2-3. auth.users는 있지만 user_profiles가 없는 경우 (비정상)
SELECT
  'auth.users 있지만 user_profiles 없음' as check_type,
  COUNT(*) as count,
  STRING_AGG(au.email, ', ') as emails
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL;

-- ============================================================================
-- 3. 포인트 데이터 무결성 확인
-- ============================================================================

-- 3-1. user_points와 auth.users 비교
SELECT
  'user_points 고아 레코드' as check_type,
  COUNT(*) as count
FROM user_points upt
LEFT JOIN auth.users au ON upt.user_id = au.id
WHERE au.id IS NULL;

-- 3-2. 포인트 잔액 통계
SELECT
  '포인트 통계' as check_type,
  COUNT(*) as total_users,
  SUM(points) as total_points,
  AVG(points) as avg_points,
  MAX(points) as max_points
FROM user_points;

-- 3-3. point_history와 user_points 일관성
SELECT
  'point_history 고아 레코드' as check_type,
  COUNT(*) as count,
  COALESCE(SUM(CASE WHEN ph.type = 'earn' THEN ph.points ELSE -ph.points END), 0) as total_points_affected
FROM point_history ph
LEFT JOIN user_points upt ON ph.user_id = upt.user_id
WHERE upt.user_id IS NULL;

-- ============================================================================
-- 4. 배송지 데이터 무결성 확인
-- ============================================================================

-- 4-1. shipping_addresses와 user_profiles 비교
SELECT
  'shipping_addresses 고아 레코드' as check_type,
  COUNT(*) as count
FROM shipping_addresses sa
LEFT JOIN user_profiles up ON sa.user_id = up.user_id
WHERE up.user_id IS NULL;

-- 4-2. 배송지 통계
SELECT
  '배송지 통계' as check_type,
  COUNT(*) as total_addresses,
  COUNT(DISTINCT user_id) as users_with_addresses
FROM shipping_addresses;

-- ============================================================================
-- 5. 쿠폰 데이터 무결성 확인
-- ============================================================================

-- 5-1. user_coupons 고아 레코드
SELECT
  'user_coupons 고아 레코드' as check_type,
  COUNT(*) as count
FROM user_coupons uc
LEFT JOIN user_profiles up ON uc.user_id = up.user_id
WHERE up.user_id IS NULL;

-- 5-2. 미사용 쿠폰 통계
SELECT
  '미사용 쿠폰' as check_type,
  COUNT(*) as count,
  COUNT(DISTINCT uc.user_id) as users_with_coupons
FROM user_coupons uc
JOIN coupons c ON uc.coupon_id = c.id
WHERE uc.is_used = false
  AND (c.valid_until IS NULL OR c.valid_until > NOW());

-- ============================================================================
-- 6. 건강 상담 데이터 무결성 확인
-- ============================================================================

-- 6-1. user_health_consultations 고아 레코드
SELECT
  'user_health_consultations 고아 레코드' as check_type,
  COUNT(*) as count
FROM user_health_consultations uhc
LEFT JOIN auth.users au ON uhc.user_id = au.id
WHERE au.id IS NULL;

-- 6-2. user_health_profiles 고아 레코드
SELECT
  'user_health_profiles 고아 레코드' as check_type,
  COUNT(*) as count
FROM user_health_profiles uhp
LEFT JOIN auth.users au ON uhp.user_id = au.id
WHERE au.id IS NULL;

-- ============================================================================
-- 7. 중복 데이터 확인
-- ============================================================================

-- 7-1. 중복 이메일 (user_profiles)
SELECT
  '중복 이메일' as check_type,
  email,
  COUNT(*) as duplicate_count,
  STRING_AGG(user_id::TEXT, ', ') as user_ids
FROM user_profiles
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 7-2. user_id가 중복된 user_points (있으면 안 됨)
SELECT
  '중복 user_points' as check_type,
  user_id,
  COUNT(*) as duplicate_count
FROM user_points
GROUP BY user_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- 8. 외래키 제약 위반 가능성 확인
-- ============================================================================

-- 8-1. orders.user_id가 있지만 유효하지 않은 경우
SELECT
  'orders 외래키 문제' as check_type,
  COUNT(*) as count
FROM orders o
WHERE o.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = o.user_id
  );

-- 8-2. order_health_consultation.user_id가 있지만 유효하지 않은 경우
SELECT
  'order_health_consultation 외래키 문제' as check_type,
  COUNT(*) as count
FROM order_health_consultation ohc
WHERE ohc.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = ohc.user_id
  );

-- ============================================================================
-- 9. 전체 요약 리포트
-- ============================================================================

SELECT
  '=== 데이터 무결성 요약 ===' as summary;

SELECT
  'auth.users' as table_name,
  COUNT(*) as record_count
FROM auth.users
UNION ALL
SELECT
  'user_profiles' as table_name,
  COUNT(*) as record_count
FROM user_profiles
UNION ALL
SELECT
  'user_points' as table_name,
  COUNT(*) as record_count
FROM user_points
UNION ALL
SELECT
  'orders' as table_name,
  COUNT(*) as record_count
FROM orders
UNION ALL
SELECT
  'shipping_addresses' as table_name,
  COUNT(*) as record_count
FROM shipping_addresses
UNION ALL
SELECT
  'user_coupons' as table_name,
  COUNT(*) as record_count
FROM user_coupons;

-- ============================================================================
-- 10. 문제 발견 시 알림
-- ============================================================================

DO $$
DECLARE
  orphaned_profiles INTEGER;
  orphaned_points INTEGER;
  duplicate_emails INTEGER;
  invalid_orders INTEGER;
BEGIN
  -- 고아 user_profiles 개수
  SELECT COUNT(*) INTO orphaned_profiles
  FROM user_profiles up
  LEFT JOIN auth.users au ON up.user_id = au.id
  WHERE au.id IS NULL;

  -- 고아 user_points 개수
  SELECT COUNT(*) INTO orphaned_points
  FROM user_points upt
  LEFT JOIN auth.users au ON upt.user_id = au.id
  WHERE au.id IS NULL;

  -- 중복 이메일 개수
  SELECT COUNT(*) INTO duplicate_emails
  FROM (
    SELECT email
    FROM user_profiles
    GROUP BY email
    HAVING COUNT(*) > 1
  ) dup;

  -- 유효하지 않은 user_id를 가진 주문 개수
  SELECT COUNT(*) INTO invalid_orders
  FROM orders o
  WHERE o.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM auth.users au WHERE au.id = o.user_id
    );

  -- 문제 요약 출력
  RAISE NOTICE '===========================================';
  RAISE NOTICE '데이터 무결성 검증 결과';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '고아 user_profiles: %', orphaned_profiles;
  RAISE NOTICE '고아 user_points: %', orphaned_points;
  RAISE NOTICE '중복 이메일: %', duplicate_emails;
  RAISE NOTICE '유효하지 않은 주문 user_id: %', invalid_orders;
  RAISE NOTICE '===========================================';

  IF orphaned_profiles > 0 OR orphaned_points > 0 OR duplicate_emails > 0 THEN
    RAISE WARNING '⚠️  데이터 정리가 필요합니다!';
    RAISE NOTICE '20260103_cleanup_orphaned_data.sql을 실행하여 정리하세요.';
  ELSE
    RAISE NOTICE '✅ 데이터 무결성 문제가 발견되지 않았습니다.';
  END IF;

  IF invalid_orders > 0 THEN
    RAISE WARNING '⚠️  주의: orders 테이블에 유효하지 않은 user_id가 있습니다!';
    RAISE NOTICE '이는 CASCADE 설정 문제일 수 있습니다. 수동으로 NULL 처리가 필요할 수 있습니다.';
  END IF;
END $$;
