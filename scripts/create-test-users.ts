/**
 * 테스트 사용자 계정 생성 스크립트
 *
 * 사용법:
 * 1. Supabase Service Role Key를 환경 변수로 설정하거나
 * 2. 스크립트 실행 시 직접 입력
 *
 * 예시:
 * SUPABASE_SERVICE_ROLE_KEY=your-service-role-key npx tsx scripts/create-test-users.ts
 */

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import readline from 'node:readline';
import { env } from '../env';

const SUPABASE_URL_FALLBACK = 'https://mkbeonizkvrzjqihhcmg.supabase.co';

const SUPABASE_URL = (() => {
  try {
    return env.NEXT_PUBLIC_SUPABASE_URL;
  } catch {
    return SUPABASE_URL_FALLBACK;
  }
})();

type TestUser = {
  email: string;
  password: string;
  displayName: string;
  phone: string;
};

type CreateUserResult =
  | {
      success: true;
      user: User;
      credentials: {
        email: string;
        password: string;
      };
    }
  | {
      success: false;
      error: string;
    };

const DEFAULT_TEST_USERS: TestUser[] = [
  {
    email: 'test1@example.com',
    password: 'test123!@#',
    displayName: '테스트유저1',
    phone: '010-1111-1111'
  },
  {
    email: 'test2@example.com',
    password: 'test123!@#',
    displayName: '테스트유저2',
    phone: '010-2222-2222'
  },
  {
    email: 'test3@example.com',
    password: 'test123!@#',
    displayName: '테스트유저3',
    phone: '010-3333-3333'
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function getServiceRoleKey(): Promise<string> {
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    return env.SUPABASE_SERVICE_ROLE_KEY;
  }

  console.log('\n⚠️  Service Role Key를 찾을 수 없습니다.');
  console.log('Supabase Dashboard > Settings > API > service_role key에서 복사하세요.\n');

  const key = await question('Service Role Key를 입력하세요: ');
  return key.trim();
}

async function createUser(supabase: SupabaseClient, userData: TestUser): Promise<CreateUserResult> {
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        display_name: userData.displayName
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData?.user) {
      throw new Error('생성된 사용자 정보를 가져올 수 없습니다.');
    }

    console.log(`✅ Auth 사용자 생성 완료: ${userData.email} (ID: ${authData.user.id})`);

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        display_name: userData.displayName,
        phone: userData.phone
      })
      .eq('user_id', authData.user.id);

    if (profileError) {
      console.warn(`⚠️  프로필 업데이트 실패: ${profileError.message}`);
    } else {
      console.log(`✅ 프로필 업데이트 완료: ${userData.displayName}`);
    }

    const { error: pointError } = await supabase.rpc('add_points', {
      p_user_id: authData.user.id,
      p_points: 1000,
      p_reason: '회원가입 축하 포인트'
    });

    if (pointError) {
      console.warn(`⚠️  포인트 지급 실패: ${pointError.message}`);
    } else {
      console.log('✅ 웰컴 포인트 지급 완료: 1000 포인트');
    }

    return {
      success: true,
      user: authData.user,
      credentials: {
        email: userData.email,
        password: userData.password
      }
    };
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`❌ 사용자 생성 실패 (${userData.email}):`, message);
    return {
      success: false,
      error: message
    };
  }
}

async function createTestUsers() {
  console.log('🚀 테스트 사용자 생성 스크립트 시작\n');

  try {
    const serviceRoleKey = await getServiceRoleKey();

    if (!serviceRoleKey) {
      console.error('❌ Service Role Key가 필요합니다.');
      rl.close();
      process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`\n📝 ${DEFAULT_TEST_USERS.length}명의 테스트 사용자를 생성합니다...\n`);

    const successful: Array<{ user: TestUser; result: Extract<CreateUserResult, { success: true }> }> = [];
    const failed: Array<{ user: TestUser; result: Extract<CreateUserResult, { success: false }> }> = [];

    for (const userData of DEFAULT_TEST_USERS) {
      console.log(`\n📧 생성 중: ${userData.email}`);
      const result = await createUser(supabase, userData);

      if (result.success) {
        successful.push({ user: userData, result });
      } else {
        failed.push({ user: userData, result });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n\n=================================');
    console.log('📊 생성 결과 요약');
    console.log('=================================\n');

    console.log(`✅ 성공: ${successful.length}명`);
    console.log(`❌ 실패: ${failed.length}명\n`);

    if (successful.length > 0) {
      console.log('🔑 생성된 계정 정보:\n');
      successful.forEach(({ result }) => {
        console.log(`이메일: ${result.credentials.email}`);
        console.log(`비밀번호: ${result.credentials.password}`);
        console.log(`사용자 ID: ${result.user.id}\n`);
      });
    }

    if (failed.length > 0) {
      console.log('⚠️  실패한 계정:\n');
      failed.forEach(({ user, result }) => {
        console.log(`${user.email}: ${result.error}`);
      });
    }

    console.log('\n=================================');
    console.log('✨ 스크립트 완료');
    console.log('=================================\n');
  } catch (error) {
    console.error('\n❌ 오류 발생:', getErrorMessage(error));
    console.error(error);
  } finally {
    rl.close();
  }
}

void createTestUsers();
