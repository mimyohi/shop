import { test, expect } from "@playwright/test";

// 모든 공개 페이지 목록
const publicPages = [
  { path: "/", name: "홈페이지" },
  { path: "/products", name: "상품 목록" },
  { path: "/auth/login", name: "로그인" },
  { path: "/auth/signup", name: "회원가입" },
  { path: "/coupons", name: "쿠폰" },
];

// 인증이 필요한 페이지 (로그인 없이 접근 시 동작 확인)
const protectedPages = [
  { path: "/profile", name: "프로필" },
  { path: "/profile/points", name: "포인트" },
  { path: "/checkout", name: "결제" },
  { path: "/checkout/success", name: "결제 성공" },
  { path: "/checkout/fail", name: "결제 실패" },
  { path: "/checkout/test-success", name: "테스트 결제 성공" },
];

test.describe("Page Runtime Error Detection", () => {
  for (const pageInfo of publicPages) {
    test(`${pageInfo.name} (${pageInfo.path}) - 런타임 에러 없음`, async ({
      page,
    }) => {
      const errors: string[] = [];

      // 콘솔 에러 수집
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          // React 개발 모드 경고 및 네트워크 에러는 무시
          if (
            !text.includes("Warning:") &&
            !text.includes("DevTools") &&
            !text.includes("Download the React DevTools") &&
            !text.includes("Failed to load resource") &&
            !text.includes("net::ERR_")
          ) {
            errors.push(text);
          }
        }
      });

      // 페이지 에러 수집
      page.on("pageerror", (error) => {
        errors.push(`Page Error: ${error.message}`);
      });

      await page.goto(pageInfo.path);
      await page.waitForLoadState("networkidle");

      // 페이지가 정상적으로 렌더링되었는지 확인
      await expect(page.locator("body")).toBeVisible();

      // 에러가 없어야 함
      expect(errors, `런타임 에러 발생: ${errors.join(", ")}`).toHaveLength(0);
    });
  }

  for (const pageInfo of protectedPages) {
    test(`${pageInfo.name} (${pageInfo.path}) - 런타임 에러 없음 (비인증 상태)`, async ({
      page,
    }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (
            !text.includes("Warning:") &&
            !text.includes("DevTools") &&
            !text.includes("Download the React DevTools") &&
            !text.includes("Failed to load resource") &&
            !text.includes("net::ERR_")
          ) {
            errors.push(text);
          }
        }
      });

      page.on("pageerror", (error) => {
        errors.push(`Page Error: ${error.message}`);
      });

      await page.goto(pageInfo.path);
      await page.waitForLoadState("networkidle");

      // 페이지 또는 리다이렉트된 페이지가 렌더링되어야 함
      await expect(page.locator("body")).toBeVisible();

      // 에러가 없어야 함
      expect(errors, `런타임 에러 발생: ${errors.join(", ")}`).toHaveLength(0);
    });
  }
});

test.describe("Product Detail Page", () => {
  test("상품 상세 페이지 - 런타임 에러 없음", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          !text.includes("Warning:") &&
          !text.includes("DevTools") &&
          !text.includes("Download the React DevTools") &&
          !text.includes("Failed to load resource") &&
          !text.includes("net::ERR_")
        ) {
          errors.push(text);
        }
      }
    });

    page.on("pageerror", (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    // 먼저 상품 목록에서 첫 번째 상품 찾기
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // 상품 카드 링크 찾기 (a 태그 중에서 /products/로 시작하는 것)
    const productLinks = page.locator('a[href*="/products/"]');
    const count = await productLinks.count();

    if (count > 0) {
      // 첫 번째 상품 링크 클릭
      const firstLink = productLinks.first();
      const href = await firstLink.getAttribute("href");

      if (href && href.includes("/products/") && href !== "/products") {
        await firstLink.click();
        await page.waitForLoadState("networkidle");

        // 상품 상세 페이지에서 에러 확인
        await expect(page.locator("body")).toBeVisible();
      }
    }

    expect(errors, `런타임 에러 발생: ${errors.join(", ")}`).toHaveLength(0);
  });
});
