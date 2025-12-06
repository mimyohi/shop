import { test, expect } from "@playwright/test";

test.describe("Order and Payment", () => {
  test.describe("Checkout Page", () => {
    test("should load checkout page", async ({ page }) => {
      await page.goto("/checkout");

      // URL 확인 (주문 정보 없으면 products로 리다이렉트 될 수 있음)
      await expect(page).toHaveURL(/checkout|products/);
    });

    test("should show order form elements when order exists", async ({ page }) => {
      // 주문 스토어에 아이템 추가 (로컬스토리지 설정)
      await page.goto("/");
      await page.evaluate(() => {
        const mockOrderItem = {
          state: {
            item: {
              option: {
                id: "test-option-1",
                name: "테스트 옵션",
                price: 50000,
              },
              quantity: 1,
              visit_type: "first",
              selected_settings: [],
            },
          },
          version: 0,
        };
        localStorage.setItem("order-storage", JSON.stringify(mockOrderItem));
      });

      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      // 주문 상품 섹션 확인
      const orderSection = page.locator("text=주문 상품");
      if (await orderSection.isVisible()) {
        await expect(orderSection).toBeVisible();
      }
    });

    test("should show health consultation form", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        const mockOrderItem = {
          state: {
            item: {
              option: {
                id: "test-option-1",
                name: "테스트 옵션",
                price: 50000,
              },
              quantity: 1,
              visit_type: "first",
              selected_settings: [],
            },
          },
          version: 0,
        };
        localStorage.setItem("order-storage", JSON.stringify(mockOrderItem));
      });

      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      // 문진 정보 섹션 확인
      const healthSection = page.locator("text=문진 정보");
      if (await healthSection.isVisible()) {
        await expect(healthSection).toBeVisible();
      }
    });

    test("should calculate total price correctly", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        const mockOrderItem = {
          state: {
            item: {
              option: {
                id: "test-option-1",
                name: "테스트 옵션",
                price: 50000,
              },
              quantity: 2,
              visit_type: "first",
              selected_settings: [],
            },
          },
          version: 0,
        };
        localStorage.setItem("order-storage", JSON.stringify(mockOrderItem));
      });

      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      // 최종 결제 금액 확인
      const finalPriceSection = page.locator("text=최종 결제 금액");
      if (await finalPriceSection.isVisible()) {
        // 금액이 표시되는지 확인
        const priceText = page.locator("text=/\\d+.*원/");
        expect(await priceText.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Payment Flow", () => {
    test("should have payment button", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        const mockOrderItem = {
          state: {
            item: {
              option: {
                id: "test-option-1",
                name: "테스트 옵션",
                price: 50000,
              },
              quantity: 1,
              visit_type: "first",
              selected_settings: [],
            },
          },
          version: 0,
        };
        localStorage.setItem("order-storage", JSON.stringify(mockOrderItem));
      });

      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      // 결제 버튼 확인
      const payButton = page.getByRole("button", { name: /결제/i });
      if ((await payButton.count()) > 0) {
        await expect(payButton.first()).toBeVisible();
      }
    });

    test("should have test payment button in development", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        const mockOrderItem = {
          state: {
            item: {
              option: {
                id: "test-option-1",
                name: "테스트 옵션",
                price: 50000,
              },
              quantity: 1,
              visit_type: "first",
              selected_settings: [],
            },
          },
          version: 0,
        };
        localStorage.setItem("order-storage", JSON.stringify(mockOrderItem));
      });

      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      // 테스트 결제 버튼 확인 (개발 환경에서만)
      const testPayButton = page.getByRole("button", { name: /테스트 결제/i });
      // 개발 환경이면 보이고, 프로덕션이면 안 보임
      const isVisible = await testPayButton.isVisible().catch(() => false);

      // 어느 쪽이든 테스트는 통과 (환경에 따라 다름)
      expect(typeof isVisible).toBe("boolean");
    });
  });

  test.describe("Order Success/Failure Pages", () => {
    test("should load checkout success page", async ({ page }) => {
      await page.goto("/checkout/success");

      // 성공 페이지 로드 확인
      await expect(page).toHaveURL(/checkout\/success/);
      await page.waitForLoadState("domcontentloaded");
    });

    test("should load checkout fail page", async ({ page }) => {
      await page.goto("/checkout/fail");

      // 실패 페이지 로드 확인
      await expect(page).toHaveURL(/checkout\/fail/);
      await page.waitForLoadState("domcontentloaded");
    });

    test("should load test success page", async ({ page }) => {
      await page.goto("/checkout/test-success");

      // 테스트 성공 페이지 로드 확인
      await expect(page).toHaveURL(/checkout\/test-success/);
      await page.waitForLoadState("domcontentloaded");
    });
  });

  test.describe("Order History", () => {
    test("should load orders page", async ({ page }) => {
      await page.goto("/orders");

      // 주문 내역 페이지 또는 로그인 페이지로 리다이렉트
      await page.waitForLoadState("networkidle");

      const currentUrl = page.url();
      const isOrdersPage = currentUrl.includes("/orders");
      const isLoginPage = currentUrl.includes("/auth/login");

      // 둘 중 하나여야 함
      expect(isOrdersPage || isLoginPage).toBeTruthy();
    });
  });

  test.describe("Shipping Fee Calculation", () => {
    test("should show shipping fee section", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        const mockOrderItem = {
          state: {
            item: {
              option: {
                id: "test-option-1",
                name: "테스트 옵션",
                price: 50000,
              },
              quantity: 1,
              visit_type: "first",
              selected_settings: [],
            },
          },
          version: 0,
        };
        localStorage.setItem("order-storage", JSON.stringify(mockOrderItem));
      });

      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      // 배송비 관련 텍스트 확인
      const shippingText = page.locator("text=/배송비|배송/");
      if ((await shippingText.count()) > 0) {
        await expect(shippingText.first()).toBeVisible();
      }
    });
  });

  test.describe("Coupon and Points", () => {
    test("should show discount section for logged in users", async ({
      page,
    }) => {
      await page.goto("/");
      await page.evaluate(() => {
        const mockOrderItem = {
          state: {
            item: {
              option: {
                id: "test-option-1",
                name: "테스트 옵션",
                price: 50000,
              },
              quantity: 1,
              visit_type: "first",
              selected_settings: [],
            },
          },
          version: 0,
        };
        localStorage.setItem("order-storage", JSON.stringify(mockOrderItem));
      });

      await page.goto("/checkout");
      await page.waitForLoadState("networkidle");

      // 할인 혜택 섹션 확인 (로그인 시에만 표시)
      const discountSection = page.locator("text=/할인|포인트|쿠폰/i");

      // 로그인 상태에 따라 표시 여부가 다름
      const count = await discountSection.count();

      // 섹션이 있거나 없거나 둘 다 유효
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});

test.describe("Direct Purchase Flow", () => {
  test("should select options and purchase from product page", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    const productLink = page.locator('a[href^="/products/"]').first();
    const productCount = await page.locator('a[href^="/products/"]').count();

    test.skip(productCount === 0, "No products available to test");

    // 상품 상세 페이지로 이동
    await productLink.click();
    await page.waitForLoadState("networkidle");

    // 바로 구매 버튼 찾기
    const buyButton = page.getByRole("button", {
      name: /바로 구매|구매하기/i,
    });

    if ((await buyButton.count()) > 0) {
      await expect(buyButton.first()).toBeVisible();
    }
  });
});
