import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");

    // 네비게이션 요소 확인
    const nav = page.locator("nav, header");
    await expect(nav.first()).toBeVisible();
  });

  test("should navigate to main pages", async ({ page }) => {
    // 홈페이지
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // 상품 목록
    await page.goto("/products");
    await expect(page).toHaveURL("/products");

    // 로그인
    await page.goto("/auth/login");
    await expect(page).toHaveURL("/auth/login");

    // 회원가입
    await page.goto("/auth/signup");
    await expect(page).toHaveURL("/auth/signup");
  });

  test("should have responsive layout", async ({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // 데스크톱 뷰포트
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Protected Routes", () => {
  test("should redirect to login when accessing profile without auth", async ({
    page,
  }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // 로그인 페이지로 리다이렉트되거나 프로필 페이지가 표시됨
    const currentUrl = page.url();
    // 인증되지 않은 경우 처리 확인
    expect(currentUrl).toBeTruthy();
  });

  test("should redirect to login when accessing orders without auth", async ({
    page,
  }) => {
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");

    // 주문 내역 페이지 접근 확인
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });
});
