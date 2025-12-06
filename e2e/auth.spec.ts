import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Signup", () => {
    test("should show signup form with all required elements", async ({
      page,
    }) => {
      await page.goto("/auth/signup");

      // 페이지 타이틀 확인
      await expect(page.locator("h2")).toContainText("회원가입");

      // 필수 폼 요소 확인
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="passwordConfirm"]')).toBeVisible();
      await expect(page.locator('input[name="displayName"]')).toBeVisible();
    });

    test("should show email validation feedback", async ({ page }) => {
      await page.goto("/auth/signup");

      const emailInput = page.locator('input[name="email"]');

      // 유효한 이메일 형식 입력
      await emailInput.fill("test@example.com");

      // 로딩 스피너 또는 결과 아이콘이 나타날 때까지 대기
      await expect(
        page.locator('input[name="email"]').locator("..").locator("svg")
      ).toBeVisible({ timeout: 3000 });
    });

    test("should require phone verification before signup", async ({
      page,
    }) => {
      await page.goto("/auth/signup");

      // 전화번호 인증 섹션 확인 (정확한 텍스트)
      await expect(
        page.getByText("전화번호 인증", { exact: true })
      ).toBeVisible();

      // 인증번호 받기 버튼 확인
      const sendOtpButton = page.getByRole("button", {
        name: /인증번호 받기/i,
      });
      await expect(sendOtpButton).toBeVisible();

      // 회원가입 버튼이 비활성화 상태인지 확인 (전화번호 미인증)
      const submitButton = page.getByRole("button", {
        name: /전화번호 인증 후 회원가입/i,
      });
      await expect(submitButton).toBeDisabled();
    });

    test("should have link to login page", async ({ page }) => {
      await page.goto("/auth/signup");

      // 로그인 링크 확인
      const loginLink = page.getByRole("link", { name: /로그인하기/i });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute("href", "/auth/login");
    });
  });

  test.describe("Login", () => {
    test("should show login form with all required elements", async ({
      page,
    }) => {
      await page.goto("/auth/login");

      // 페이지 타이틀 확인
      await expect(page.locator("h2")).toContainText("로그인");

      // 필수 폼 요소 확인
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();

      // 로그인 버튼 확인
      const loginButton = page.getByRole("button", { name: /^로그인$/i });
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeEnabled();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/auth/login");

      // 잘못된 자격 증명 입력
      await page.locator('input[name="email"]').fill("invalid@example.com");
      await page.locator('input[name="password"]').fill("wrongpassword");

      // 로그인 버튼 클릭
      await page.getByRole("button", { name: /^로그인$/i }).click();

      // 에러 메시지 확인 (bg-red-50 클래스를 가진 요소)
      const errorBox = page.locator(".bg-red-50");
      await expect(errorBox).toBeVisible({ timeout: 10000 });
      await expect(errorBox).toContainText(/로그인에 실패|오류/i);
    });

    test("should have Kakao login button with correct styling", async ({
      page,
    }) => {
      await page.goto("/auth/login");

      // 카카오 로그인 버튼 확인
      const kakaoButton = page.getByRole("button", {
        name: /카카오로 계속하기/i,
      });
      await expect(kakaoButton).toBeVisible();

      // 카카오 버튼 스타일 확인 (노란 배경)
      await expect(kakaoButton).toHaveCSS(
        "background-color",
        "rgb(254, 229, 0)"
      );
    });

    test("should display error message for email_already_registered", async ({
      page,
    }) => {
      // 에러 파라미터와 함께 로그인 페이지 방문
      await page.goto("/auth/login?error=email_already_registered");

      // 에러 메시지 확인
      const errorBox = page.locator(".bg-red-50");
      await expect(errorBox).toBeVisible();
      await expect(errorBox).toContainText(
        "이미 이메일로 가입된 계정이 있습니다"
      );
    });

    test("should display error message for auth_callback_failed", async ({
      page,
    }) => {
      await page.goto("/auth/login?error=auth_callback_failed");

      const errorBox = page.locator(".bg-red-50");
      await expect(errorBox).toBeVisible();
      await expect(errorBox).toContainText("다시 시도해주세요");
    });

    test("should have link to signup page", async ({ page }) => {
      await page.goto("/auth/login");

      // 회원가입 링크 확인 (정확한 텍스트)
      const signupLink = page.getByRole("link", {
        name: "회원가입하기",
        exact: true,
      });
      await expect(signupLink).toBeVisible();
      await expect(signupLink).toHaveAttribute("href", "/auth/signup");
    });
  });
});
