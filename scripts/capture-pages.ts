import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join } from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOTS_DIR = join(process.cwd(), "screenshots");

interface PageInfo {
  name: string;
  path: string;
  requiresAuth?: boolean;
  description: string;
}

const pages: PageInfo[] = [
  { name: "home", path: "/", description: "홈페이지" },
  { name: "login", path: "/auth/login", description: "로그인 페이지" },
  { name: "signup", path: "/auth/signup", description: "회원가입 페이지" },
  { name: "products", path: "/products", description: "상품 목록" },
  {
    name: "coupons",
    path: "/coupons",
    requiresAuth: true,
    description: "쿠폰",
  },
  {
    name: "profile",
    path: "/profile",
    requiresAuth: true,
    description: "마이페이지",
  },
  {
    name: "profile-points",
    path: "/profile/points",
    requiresAuth: true,
    description: "포인트",
  },
  {
    name: "orders",
    path: "/orders",
    requiresAuth: true,
    description: "주문 내역",
  },
  { name: "checkout", path: "/checkout", description: "결제 페이지" },
];

async function capturePages() {
  console.log("🎬 Starting page capture...\n");

  // Create screenshots directory
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const results: Array<{ page: PageInfo; success: boolean; error?: string }> =
    [];

  // Capture pages without auth
  for (const pageInfo of pages.filter((p) => !p.requiresAuth)) {
    try {
      console.log(`📸 Capturing ${pageInfo.description} (${pageInfo.path})...`);

      await page.goto(`${BASE_URL}${pageInfo.path}`, {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      // Wait a bit for any animations
      await page.waitForTimeout(1000);

      // Take full page screenshot
      await page.screenshot({
        path: join(SCREENSHOTS_DIR, `${pageInfo.name}.png`),
        fullPage: true,
      });

      // Take viewport screenshot
      await page.screenshot({
        path: join(SCREENSHOTS_DIR, `${pageInfo.name}-viewport.png`),
        fullPage: false,
      });

      console.log(`✅ Captured ${pageInfo.name}\n`);
      results.push({ page: pageInfo, success: true });
    } catch (error) {
      console.error(`❌ Failed to capture ${pageInfo.name}:`, error);
      results.push({
        page: pageInfo,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Try to get a product detail page
  try {
    console.log("📸 Capturing 상품 상세 페이지...");
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle" });

    // Find first product link
    const productLink = await page.locator('a[href^="/products/"]').first();
    if (productLink) {
      const href = await productLink.getAttribute("href");
      if (href) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: join(SCREENSHOTS_DIR, "product-detail.png"),
          fullPage: true,
        });

        await page.screenshot({
          path: join(SCREENSHOTS_DIR, "product-detail-viewport.png"),
          fullPage: false,
        });

        console.log("✅ Captured product-detail\n");
        results.push({
          page: {
            name: "product-detail",
            path: href,
            description: "상품 상세",
          },
          success: true,
        });
      }
    }
  } catch (error) {
    console.error("❌ Failed to capture product detail:", error);
  }

  // Check if already logged in, otherwise try to login
  await page.goto(`${BASE_URL}/`);
  const isLoggedIn = (await page.locator("text=로그아웃").count()) > 0;

  if (isLoggedIn) {
    console.log("✅ Already logged in, capturing authenticated pages...\n");

    // Capture pages that require auth
    for (const pageInfo of pages.filter((p) => p.requiresAuth)) {
      try {
        console.log(
          `📸 Capturing ${pageInfo.description} (${pageInfo.path})...`
        );

        await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: "networkidle",
          timeout: 10000,
        });

        await page.waitForTimeout(1000);

        await page.screenshot({
          path: join(SCREENSHOTS_DIR, `${pageInfo.name}.png`),
          fullPage: true,
        });

        await page.screenshot({
          path: join(SCREENSHOTS_DIR, `${pageInfo.name}-viewport.png`),
          fullPage: false,
        });

        console.log(`✅ Captured ${pageInfo.name}\n`);
        results.push({ page: pageInfo, success: true });
      } catch (error) {
        console.error(`❌ Failed to capture ${pageInfo.name}:`, error);
        results.push({
          page: pageInfo,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } else {
    console.log("⚠️  Not logged in. Skipping authenticated pages.");
    console.log("   To capture authenticated pages, please login first.\n");
  }

  await browser.close();

  // Print summary
  console.log("\n📊 Capture Summary:");
  console.log("=".repeat(50));
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);

  if (failed > 0) {
    console.log("Failed pages:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.page.name}: ${r.error}`);
      });
  }

  return results;
}

capturePages().catch(console.error);
