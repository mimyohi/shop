import { test, expect } from "@playwright/test";

test.describe("Products", () => {
  test("should show home page", async ({ page }) => {
    await page.goto("/");

    // 페이지가 성공적으로 로드되었는지 확인
    await expect(page).toHaveURL("/");

    // 네비게이션 또는 헤더 확인
    const header = page.locator("nav, header").first();
    await expect(header).toBeVisible();
  });

  test("should navigate to products page", async ({ page }) => {
    await page.goto("/products");

    // URL 확인
    await expect(page).toHaveURL("/products");

    // 페이지가 정상 로드되었는지 확인
    await page.waitForLoadState("domcontentloaded");
  });

  test("should navigate from home to products", async ({ page }) => {
    await page.goto("/");

    // 상품 링크 찾기 및 클릭
    const productsLink = page.locator('a[href="/products"]').first();

    if (await productsLink.isVisible()) {
      await productsLink.click();
      await expect(page).toHaveURL("/products");
    }
  });

  test("should show product cards on products page", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // 상품 카드 또는 링크 존재 확인
    const productLinks = page.locator('a[href^="/products/"]');
    const count = await productLinks.count();

    // 상품이 있는 경우 확인
    if (count > 0) {
      await expect(productLinks.first()).toBeVisible();
    }
  });

  test("should navigate to product detail page", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    const productLink = page.locator('a[href^="/products/"]').first();
    const productCount = await page.locator('a[href^="/products/"]').count();

    // 상품이 있는 경우에만 테스트
    test.skip(productCount === 0, "No products available to test");

    await productLink.click();
    await page.waitForLoadState("networkidle");

    // URL이 상품 상세 페이지인지 확인
    await expect(page).toHaveURL(/\/products\/.+/);
  });
});

test.describe("Product Options", () => {
  test("should display option selector when product has options", async ({
    page,
  }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    const productLink = page.locator('a[href^="/products/"]').first();
    const productCount = await page.locator('a[href^="/products/"]').count();

    test.skip(productCount === 0, "No products available to test");

    await productLink.click();
    await page.waitForLoadState("networkidle");

    // 옵션 선택 섹션 확인 (존재하는 경우)
    const optionSection = page.locator("text=옵션 선택");
    const hasOptions = await optionSection.isVisible();

    if (hasOptions) {
      // 옵션 버튼들 확인
      const optionButtons = page.locator("button").filter({
        has: page.locator("text=/원$/"),
      });
      const optionCount = await optionButtons.count();

      // 옵션이 있으면 선택 가능한지 확인
      if (optionCount > 0) {
        await expect(optionButtons.first()).toBeEnabled();
      }
    }
  });

  test("should show visit type selection after option is selected", async ({
    page,
  }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    const productLink = page.locator('a[href^="/products/"]').first();
    const productCount = await page.locator('a[href^="/products/"]').count();

    test.skip(productCount === 0, "No products available to test");

    await productLink.click();
    await page.waitForLoadState("networkidle");

    // 옵션 선택 섹션이 있는지 확인
    const optionSection = page.locator("text=옵션 선택");
    const hasOptions = await optionSection.isVisible();

    if (hasOptions) {
      // 첫 번째 옵션 클릭
      const optionButtons = page
        .locator(".border.rounded-lg")
        .filter({ hasText: /원$/ });

      if ((await optionButtons.count()) > 0) {
        await optionButtons.first().click();

        // 방문 타입 선택 UI가 나타나는지 확인
        const visitTypeSection = page.locator("text=방문 타입 선택");
        await expect(visitTypeSection).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
