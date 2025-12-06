# 카카오 OAuth 로그인 설정 가이드

이 가이드는 Supabase와 카카오 로그인을 연동하는 방법을 안내합니다.

## 1. 카카오 개발자 계정 및 애플리케이션 생성

### 1.1 카카오 개발자 콘솔 접속
1. [카카오 개발자 콘솔](https://developers.kakao.com)에 접속
2. 카카오 계정으로 로그인

### 1.2 애플리케이션 추가
1. **내 애플리케이션** 메뉴 클릭
2. **애플리케이션 추가하기** 버튼 클릭
3. 애플리케이션 정보 입력:
   - 앱 이름: `Shop` (또는 원하는 이름)
   - 사업자명: 본인 이름 또는 회사명
4. **저장** 클릭

### 1.3 REST API 키 확인
1. 생성한 애플리케이션 클릭
2. **앱 키** 섹션에서 **REST API 키** 복사
3. 이 키를 `.env.local` 파일에 저장 (나중에 사용)

## 2. 카카오 Redirect URI 설정

### 2.1 Supabase Redirect URL 확인
Supabase 카카오 OAuth의 Redirect URL은 다음 형식입니다:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

예시:
```
https://abcdefghijk.supabase.co/auth/v1/callback
```

**본인의 Supabase Project URL 확인 방법:**
1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **API** 메뉴
4. **Project URL** 복사 (예: `https://abcdefghijk.supabase.co`)
5. 뒤에 `/auth/v1/callback` 추가

### 2.2 카카오에 Redirect URI 등록
1. 카카오 개발자 콘솔에서 애플리케이션 선택
2. **제품 설정** → **카카오 로그인** 메뉴
3. **활성화 설정**을 **ON**으로 변경
4. **Redirect URI** 섹션에서 **Redirect URI 등록** 클릭
5. 위에서 확인한 Supabase Redirect URL 입력:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
6. **저장** 클릭

### 2.3 동의 항목 설정 (선택)
1. **제품 설정** → **카카오 로그인** → **동의 항목** 메뉴
2. 필요한 정보 선택 (기본적으로 프로필 정보와 이메일이 필요):
   - 닉네임 (필수)
   - 프로필 사진 (선택)
   - 카카오계정(이메일) (필수)

## 3. Supabase 설정

### 3.1 Supabase 대시보드에서 카카오 OAuth 활성화
1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Authentication** → **Providers** 메뉴
4. **Kakao** 찾아서 클릭
5. **Enable Kakao** 토글을 **ON**으로 변경

### 3.2 카카오 앱 정보 입력
1. **Kakao Client ID**: 카카오에서 복사한 **REST API 키** 입력
2. **Kakao Secret** (선택):
   - 카카오 개발자 콘솔 → **제품 설정** → **카카오 로그인** → **보안**
   - **Client Secret** 코드 생성 및 활성화
   - 생성된 코드를 Supabase에 입력
3. **Redirect URL** 확인 (자동으로 표시됨):
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
4. **Save** 클릭

## 4. 환경 변수 설정

### 4.1 `.env.local` 파일 생성/수정
프로젝트 루트에 `.env.local` 파일을 열고 다음 내용 추가:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kakao OAuth (카카오 로그인)
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_rest_api_key
```

**값 채우기:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 프로젝트의 anon key
  - Supabase 대시보드 → **Settings** → **API** → **Project API keys** → **anon public** 복사
- `NEXT_PUBLIC_KAKAO_CLIENT_ID`: 카카오 REST API 키

## 5. 테스트

### 5.1 개발 서버 실행
```bash
npm run dev
```

### 5.2 로그인 테스트
1. 브라우저에서 `http://localhost:3000/auth/login` 접속
2. **카카오로 계속하기** 버튼 클릭
3. 카카오 계정으로 로그인
4. 동의 항목 확인 후 **동의하고 계속하기** 클릭
5. 홈페이지(`/`)로 리다이렉트되면 성공!

### 5.3 사용자 확인
1. Supabase 대시보드 → **Authentication** → **Users** 메뉴
2. 카카오로 로그인한 사용자 정보 확인

## 6. 문제 해결

### 6.1 "Invalid redirect_uri" 오류
- 카카오 개발자 콘솔에 등록한 Redirect URI와 Supabase의 Redirect URL이 정확히 일치하는지 확인
- `https://`로 시작하는지 확인
- 마지막에 슬래시(`/`)가 없는지 확인

### 6.2 "Client authentication failed" 오류
- Supabase에 입력한 Kakao Client ID가 카카오 REST API 키와 일치하는지 확인
- 카카오 로그인이 **활성화** 상태인지 확인

### 6.3 "Redirect mismatch" 오류
- 브라우저 캐시 삭제
- Supabase 대시보드에서 카카오 설정 다시 저장
- 카카오 개발자 콘솔에서 Redirect URI 다시 확인

### 6.4 로그인 후 사용자 정보가 없음
- 카카오 동의 항목에서 **이메일**과 **프로필 정보**가 필수로 설정되어 있는지 확인
- Supabase 대시보드 → **Authentication** → **Users**에서 사용자 메타데이터 확인

## 7. 배포 시 추가 설정

### 7.1 프로덕션 Redirect URI 추가
배포 후 프로덕션 도메인에서도 카카오 로그인을 사용하려면:

1. 카카오 개발자 콘솔 → **Redirect URI** 섹션
2. 프로덕션 URL 추가:
   ```
   https://your-production-domain.com/auth/callback
   ```
   또는 Vercel 배포 시:
   ```
   https://your-app.vercel.app/auth/callback
   ```

### 7.2 환경 변수 설정
- Vercel/Netlify 등 배포 플랫폼의 환경 변수 설정에 `.env.local`의 모든 변수 추가

## 8. 추가 참고 자료

- [Supabase Auth with Kakao 공식 문서](https://supabase.com/docs/guides/auth/social-login/auth-kakao)
- [카카오 로그인 REST API 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [Next.js 환경 변수 문서](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)

---

설정 완료 후 카카오 로그인이 정상적으로 작동하면 이 문서는 완료입니다!
