import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// .env 파일 로드
dotenv.config({ path: path.join(__dirname, "../.env") });

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요."
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 테스트용 사용자 이메일 (auth.users에 이미 있다고 가정)
const testUserEmails = [
  "test1@example.com",
  "test2@example.com",
  "test3@example.com",
  "test4@example.com",
];

async function main() {
  console.log("🌿 한약 관련 목 데이터 삽입 시작...\n");

  try {
    // 1. 한약 상품 데이터 생성
    console.log("1️⃣ 한약 상품 생성 중...");
    const products = [
      {
        name: "프리미엄 홍삼정 120포",
        description:
          "6년근 고려홍삼을 농축한 프리미엄 홍삼정입니다. 면역력 강화와 피로 회복에 도움을 줍니다.",
        price: 180000,
        category: "홍삼/인삼",
        stock: 50,
        image_url: "https://picsum.photos/seed/hongsam1/400/400",
        detail_images: [
          "https://picsum.photos/seed/hongsam1-detail1/800/800",
          "https://picsum.photos/seed/hongsam1-detail2/800/800",
        ],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "다이어트 한약 30일분",
        description:
          "체질 맞춤 다이어트 한약으로 건강한 체중 감량을 도와드립니다. 대사 촉진과 식욕 조절에 효과적입니다.",
        price: 350000,
        category: "다이어트",
        stock: 30,
        image_url: "https://picsum.photos/seed/diet1/400/400",
        detail_images: [
          "https://picsum.photos/seed/diet1-detail1/800/800",
          "https://picsum.photos/seed/diet1-detail2/800/800",
        ],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "보중익기탕 60포",
        description:
          "기력 회복과 소화 기능 개선에 도움을 주는 전통 처방입니다. 만성 피로와 소화불량에 좋습니다.",
        price: 120000,
        category: "보약",
        stock: 40,
        image_url: "https://picsum.photos/seed/bojung1/400/400",
        detail_images: ["https://picsum.photos/seed/bojung1-detail1/800/800"],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "쌍화탕 30포",
        description:
          "몸을 따뜻하게 하고 기운을 북돋아주는 쌍화탕입니다. 감기 예방과 체력 보강에 효과적입니다.",
        price: 45000,
        category: "보약",
        stock: 100,
        image_url: "https://picsum.photos/seed/ssanghwa1/400/400",
        detail_images: ["https://picsum.photos/seed/ssanghwa1-detail1/800/800"],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "수면 개선 한약 30일분",
        description:
          "불면증과 수면의 질 개선에 도움을 주는 맞춤 한약입니다. 스트레스 완화와 깊은 수면을 유도합니다.",
        price: 280000,
        category: "수면개선",
        stock: 25,
        image_url: "https://picsum.photos/seed/sleep1/400/400",
        detail_images: [
          "https://picsum.photos/seed/sleep1-detail1/800/800",
          "https://picsum.photos/seed/sleep1-detail2/800/800",
        ],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "여성 갱년기 한약 60일분",
        description:
          "여성 갱년기 증상 완화를 위한 맞춤 한약입니다. 호르몬 밸런스 조절과 안면홍조 개선에 도움을 줍니다.",
        price: 420000,
        category: "여성건강",
        stock: 20,
        image_url: "https://picsum.photos/seed/womens1/400/400",
        detail_images: ["https://picsum.photos/seed/womens1-detail1/800/800"],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "어린이 성장 한약 90일분",
        description:
          "성장기 어린이의 키 성장과 면역력 강화를 돕는 한약입니다. 식욕 개선과 체력 향상에도 효과적입니다.",
        price: 580000,
        category: "성장",
        stock: 15,
        image_url: "https://picsum.photos/seed/growth1/400/400",
        detail_images: [
          "https://picsum.photos/seed/growth1-detail1/800/800",
          "https://picsum.photos/seed/growth1-detail2/800/800",
        ],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "탈모 개선 한약 90일분",
        description:
          "모발 성장 촉진과 탈모 예방을 위한 맞춤 한약입니다. 두피 건강 개선과 모근 강화에 도움을 줍니다.",
        price: 480000,
        category: "탈모",
        stock: 18,
        image_url: "https://picsum.photos/seed/hair1/400/400",
        detail_images: ["https://picsum.photos/seed/hair1-detail1/800/800"],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "면역력 강화 한약 60일분",
        description:
          "면역력 증진과 질병 예방을 위한 한약입니다. 잦은 감기와 만성 피로에 효과적입니다.",
        price: 320000,
        category: "면역",
        stock: 35,
        image_url: "https://picsum.photos/seed/immune1/400/400",
        detail_images: [
          "https://picsum.photos/seed/immune1-detail1/800/800",
          "https://picsum.photos/seed/immune1-detail2/800/800",
        ],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "아토피 개선 한약 60일분",
        description:
          "아토피 피부염 완화를 위한 체질 맞춤 한약입니다. 피부 가려움증 완화와 재생 촉진에 도움을 줍니다.",
        price: 380000,
        category: "피부",
        stock: 22,
        image_url: "https://picsum.photos/seed/atopy1/400/400",
        detail_images: ["https://picsum.photos/seed/atopy1-detail1/800/800"],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "소화기능 개선 한약 30일분",
        description:
          "만성 소화불량과 위장 기능 개선을 위한 한약입니다. 속쓰림과 복부팽만감 완화에 효과적입니다.",
        price: 220000,
        category: "소화기",
        stock: 45,
        image_url: "https://picsum.photos/seed/digest1/400/400",
        detail_images: ["https://picsum.photos/seed/digest1-detail1/800/800"],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
      {
        name: "천연 녹용 캡슐 120캡슐",
        description:
          "프리미엄 뉴질랜드산 녹용을 캡슐화한 제품입니다. 체력 증진과 기력 회복에 탁월합니다.",
        price: 280000,
        category: "홍삼/인삼",
        stock: 30,
        image_url: "https://picsum.photos/seed/nokyong1/400/400",
        detail_images: ["https://picsum.photos/seed/nokyong1-detail1/800/800"],
        is_visible_on_main: true,
        slug: Math.random().toString(36).substring(2, 10),
      },
    ];

    const { data: insertedProducts, error: productsError } = await supabase
      .from("products")
      .insert(products)
      .select();

    if (productsError) {
      console.error("상품 삽입 오류:", productsError);
      throw productsError;
    }

    console.log(`✅ ${insertedProducts?.length}개 한약 상품 생성 완료\n`);

    // 2. 상품 옵션 추가
    console.log("2️⃣ 상품 옵션 생성 중...");
    const dietProduct = insertedProducts?.find((p) =>
      p.name.includes("다이어트")
    );
    const growthProduct = insertedProducts?.find((p) =>
      p.name.includes("성장")
    );

    if (dietProduct) {
      const { data: option, error: optionError } = await supabase
        .from("product_options")
        .insert({
          product_id: dietProduct.id,
          name: "복용 기간",
          is_required: true,
          display_order: 1,
        })
        .select()
        .single();

      if (option) {
        await supabase.from("product_option_values").insert([
          {
            option_id: option.id,
            value: "1개월",
            price_adjustment: 0,
            stock: 30,
            display_order: 1,
          },
          {
            option_id: option.id,
            value: "2개월",
            price_adjustment: 300000,
            stock: 25,
            display_order: 2,
          },
          {
            option_id: option.id,
            value: "3개월",
            price_adjustment: 550000,
            stock: 20,
            display_order: 3,
          },
        ]);
      }
    }

    if (growthProduct) {
      const { data: option, error: optionError } = await supabase
        .from("product_options")
        .insert({
          product_id: growthProduct.id,
          name: "복용 기간",
          is_required: true,
          display_order: 1,
        })
        .select()
        .single();

      if (option) {
        await supabase.from("product_option_values").insert([
          {
            option_id: option.id,
            value: "3개월",
            price_adjustment: 0,
            stock: 15,
            display_order: 1,
          },
          {
            option_id: option.id,
            value: "6개월",
            price_adjustment: 550000,
            stock: 10,
            display_order: 2,
          },
        ]);
      }
    }

    console.log("✅ 상품 옵션 생성 완료\n");

    // 3. 쿠폰 생성
    console.log("3️⃣ 쿠폰 생성 중...");
    const coupons = [
      {
        code: "WELCOME2025",
        name: "신규 회원 환영 쿠폰",
        description: "첫 구매 시 10% 할인",
        discount_type: "percentage",
        discount_value: 10,
        min_purchase: 100000,
        max_discount: 50000,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        usage_limit: 1000,
        used_count: 0,
        is_active: true,
      },
      {
        code: "HERBAL50K",
        name: "한약 구매 할인",
        description: "한약 구매 시 5만원 할인",
        discount_type: "fixed",
        discount_value: 50000,
        min_purchase: 300000,
        max_discount: null,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usage_limit: 500,
        used_count: 0,
        is_active: true,
      },
      {
        code: "SUMMER2025",
        name: "여름 건강 특가",
        description: "전 상품 15% 할인",
        discount_type: "percentage",
        discount_value: 15,
        min_purchase: 150000,
        max_discount: 100000,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usage_limit: 300,
        used_count: 0,
        is_active: true,
      },
    ];

    const { error: couponsError } = await supabase
      .from("coupons")
      .insert(coupons);

    if (couponsError) {
      console.error("쿠폰 삽입 오류:", couponsError);
    } else {
      console.log(`✅ ${coupons.length}개 쿠폰 생성 완료\n`);
    }

    // 4. 테스트 사용자 프로필 생성 (auth.users가 있다고 가정)
    console.log("4️⃣ 사용자 프로필 생성 중...");

    // auth.users에서 실제 사용자 가져오기
    const { data: authUsers } = await supabase.auth.admin.listUsers();

    if (authUsers && authUsers.users.length > 0) {
      const userProfiles = authUsers.users.slice(0, 4).map((user, index) => ({
        user_id: user.id,
        email: user.email!,
        display_name: `테스트 사용자 ${index + 1}`,
        phone: `010-${String(1000 + index).padStart(4, "0")}-${String(
          1000 + index * 2
        ).padStart(4, "0")}`,
      }));

      const { data: insertedProfiles, error: profilesError } = await supabase
        .from("user_profiles")
        .insert(userProfiles)
        .select();

      if (insertedProfiles) {
        console.log(
          `✅ ${insertedProfiles.length}개 사용자 프로필 생성 완료\n`
        );

        // 5. 사용자별 포인트 초기화
        console.log("5️⃣ 사용자 포인트 초기화 중...");
        const userPoints = insertedProfiles.map((profile) => ({
          user_id: profile.user_id,
          points: 50000,
          total_earned: 50000,
          total_used: 0,
        }));

        await supabase.from("user_points").insert(userPoints);
        console.log("✅ 사용자 포인트 초기화 완료\n");

        // 6. 주문 데이터 생성
        console.log("6️⃣ 주문 데이터 생성 중...");

        // 관리자 정보 가져오기
        const { data: admins } = await supabase
          .from("admin_users")
          .select("id")
          .limit(2);

        const orders = [];
        const orderItems = [];
        const orderHealthConsultations = [];

        for (let i = 0; i < 20; i++) {
          const profile = insertedProfiles[i % insertedProfiles.length];
          const product = insertedProducts![i % insertedProducts!.length];
          const orderId = `ORD-${Date.now()}-${i}`;

          // 다양한 상담 상태
          const consultationStatuses = [
            "chatting_required",
            "consultation_required",
            "on_hold",
            "consultation_completed",
            "shipping_on_hold",
            "shipped",
            "cancelled",
          ];
          const consultationStatus =
            consultationStatuses[i % consultationStatuses.length];

          // 결제 상태
          let status = "completed";
          if (consultationStatus === "cancelled") {
            status = "cancelled";
          }

          const quantity = Math.floor(Math.random() * 2) + 1;
          const totalAmount = product.price * quantity;

          const order = {
            user_id: profile.user_id,
            user_email: profile.email,
            user_name: profile.display_name,
            user_phone: profile.phone,
            total_amount: totalAmount,
            status,
            consultation_status: consultationStatus,
            order_id: orderId,
            payment_key: status === "completed" ? `pay_${orderId}` : null,
            used_points: 0,
            coupon_discount: 0,
            assigned_admin_id:
              admins && admins.length > 0 ? admins[i % admins.length].id : null,
            shipping_name: profile.display_name,
            shipping_phone: profile.phone,
            shipping_postal_code: "06236",
            shipping_address: "서울시 강남구 테헤란로 123",
            shipping_address_detail: `${i + 1}층 ${i + 101}호`,
            order_memo: i % 3 === 0 ? "빠른 배송 부탁드립니다." : null,
            created_at: new Date(
              Date.now() - (20 - i) * 24 * 60 * 60 * 1000
            ).toISOString(),
          };

          orders.push(order);
        }

        const { data: insertedOrders, error: ordersError } = await supabase
          .from("orders")
          .insert(orders)
          .select();

        if (insertedOrders) {
          console.log(`✅ ${insertedOrders.length}개 주문 생성 완료\n`);

          // 7. 주문 항목 생성
          console.log("7️⃣ 주문 항목 생성 중...");
          for (const order of insertedOrders) {
            const product =
              insertedProducts![
                Math.floor(Math.random() * insertedProducts!.length)
              ];
            const quantity = Math.floor(Math.random() * 2) + 1;

            orderItems.push({
              order_id: order.id,
              product_id: product.id,
              product_name: product.name,
              product_price: product.price,
              quantity,
              selected_options: null,
              selected_addons: null,
            });

            // 문진 정보 생성
            orderHealthConsultations.push({
              order_id: order.id,
              user_id: order.user_id,
              name: order.user_name,
              phone: order.user_phone,
              current_height: 165 + Math.random() * 20,
              current_weight: 60 + Math.random() * 30,
              min_weight_since_20s: 55 + Math.random() * 10,
              max_weight_since_20s: 75 + Math.random() * 20,
              target_weight: 60 + Math.random() * 10,
              target_weight_loss_period: ["1개월", "2개월", "3개월"][
                Math.floor(Math.random() * 3)
              ],
              occupation: ["사무직", "서비스직", "전문직"][
                Math.floor(Math.random() * 3)
              ],
              work_hours: "09:00-18:00",
              has_shift_work: false,
              wake_up_time: "07:00",
              bedtime: "23:00",
              has_daytime_sleepiness: Math.random() > 0.5,
              meal_pattern: ["2meals", "3meals", "irregular"][
                Math.floor(Math.random() * 3)
              ],
              alcohol_frequency:
                Math.random() > 0.5 ? "weekly_1_or_less" : "weekly_2_or_more",
              water_intake: Math.random() > 0.5 ? "1L_or_less" : "over_1L",
              diet_approach: Math.random() > 0.5 ? "sustainable" : "fast",
              preferred_stage: ["stage1", "stage2", "stage3"][
                Math.floor(Math.random() * 3)
              ],
              medical_history: "특이사항 없음",
              referral_source: ["검색", "지인추천", "광고"][
                Math.floor(Math.random() * 3)
              ],
            });
          }

          await supabase.from("order_items").insert(orderItems);
          console.log(`✅ ${orderItems.length}개 주문 항목 생성 완료\n`);

          await supabase
            .from("order_health_consultation")
            .insert(orderHealthConsultations);
          console.log(
            `✅ ${orderHealthConsultations.length}개 문진 정보 생성 완료\n`
          );

        }
      }
    } else {
      console.log(
        "⚠️  auth.users에 사용자가 없습니다. 사용자 관련 데이터는 생성하지 않습니다.\n"
      );
    }

    console.log("✨ 한약 관련 목 데이터 삽입 완료!\n");
    console.log("생성된 데이터:");
    console.log(`- 한약 상품: ${insertedProducts?.length}개`);
    console.log("- 상품 옵션: 2개 상품에 복용 기간 옵션 추가");
    console.log(`- 쿠폰: ${coupons.length}개`);
    if (authUsers && authUsers.users.length > 0) {
      console.log("- 사용자 프로필: 4개");
      console.log("- 사용자 포인트: 각 50,000P");
      console.log("- 주문: 20개 (다양한 상담 상태)");
      console.log("- 주문 항목: 20개");
      console.log("- 문진 정보: 20개");
      console.log("- 리뷰: 배송 완료 주문에 대한 리뷰");
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  }
}

main();
