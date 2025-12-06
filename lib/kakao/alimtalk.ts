/**
 * 카카오톡 알림톡 API 래퍼
 * Solapi의 카카오톡 알림톡 서비스 사용
 *
 * 사용 전 준비사항:
 * 1. https://solapi.com 회원가입
 * 2. API Key 발급
 * 3. 카카오톡 채널 생성 및 연동
 * 4. 알림톡 템플릿 등록 및 승인
 * 5. 충전 (최소 5만원 권장)
 *
 * 환경 변수 설정:
 * SOLAPI_API_KEY=your_api_key
 * SOLAPI_API_SECRET=your_api_secret
 * KAKAO_SENDER_KEY=your_kakao_sender_key (카카오톡 채널의 발신 프로필 키)
 */
import crypto from "crypto";

import { env } from "@/env";

/**
 * 알림톡 발송 결과
 */
export interface AlimtalkResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 알림톡 API 기본 설정
 */
const SOLAPI_API_URL = "https://api.solapi.com";
const SOLAPI_SEND_MANY_ENDPOINT = `${SOLAPI_API_URL}/messages/v4/send-many/detail`;

/**
 * Solapi API 인증 헤더 생성
 */
function getAuthHeaders(): HeadersInit {
  const apiKey = env.SOLAPI_API_KEY;
  const apiSecret = env.SOLAPI_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Solapi API credentials not configured");
  }

  return {
    Authorization: createSolapiAuthHeader(apiKey, apiSecret),
    "Content-Type": "application/json",
  };
}

function createSolapiAuthHeader(apiKey: string, apiSecret: string): string {
  const dateTime = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signaturePayload = `${dateTime}${salt}`;
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(signaturePayload)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`;
}

/**
 * 전화번호 포맷팅 (E.164 형식으로 변환)
 */
function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  // 이미 82로 시작하면 그대로 반환
  if (cleanPhone.startsWith("82")) {
    return cleanPhone;
  }

  // 010으로 시작하면 0 제거하고 82 추가
  if (cleanPhone.startsWith("0")) {
    return `82${cleanPhone.substring(1)}`;
  }

  return `82${cleanPhone}`;
}

function hasRequiredAlimtalkConfig(): boolean {
  try {
    env.SOLAPI_API_KEY;
    env.SOLAPI_API_SECRET;
  } catch {
    return false;
  }

  return Boolean(env.KAKAO_SENDER_KEY);
}

type TemplateVariables = Record<string, string>;

interface SolapiFailedMessage {
  to?: string;
  statusCode?: string;
  statusMessage?: string;
  message?: string;
}

interface SolapiSendManyResponse {
  failedMessageList?: SolapiFailedMessage[];
  groupInfo?: {
    groupId?: string;
    id?: string;
  };
  message?: string;
  errorMessage?: string;
  errorCode?: string;
}

function normalizeSolapiError(message?: string): string {
  if (!message) {
    return "알림톡 발송에 실패했습니다.";
  }

  const lowered = message.toLowerCase();

  if (lowered.includes("insufficient") || lowered.includes("balance")) {
    return "알림톡 잔액이 부족합니다.";
  }

  if (lowered.includes("recipient") || lowered.includes("receiver")) {
    return "유효하지 않은 전화번호입니다.";
  }

  if (lowered.includes("api key") || lowered.includes("unauthorized")) {
    return "알림톡 API 설정이 올바르지 않습니다.";
  }

  if (lowered.includes("template") || lowered.includes("pf id")) {
    return "알림톡 템플릿을 찾을 수 없습니다.";
  }

  return message;
}

async function sendAlimtalkMessage({
  phone,
  templateCode,
  variables,
}: {
  phone: string;
  templateCode: string;
  variables: TemplateVariables;
}): Promise<AlimtalkResult> {
  const senderKey = env.KAKAO_SENDER_KEY;

  if (!senderKey) {
    return {
      success: false,
      error: "카카오톡 발신 프로필이 설정되지 않았습니다.",
    };
  }

  const formattedPhone = formatPhone(phone);

  try {
    const response = await fetch(SOLAPI_SEND_MANY_ENDPOINT, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        messages: [
          {
            to: formattedPhone,
            type: "ATA",
            kakaoOptions: {
              senderKey,
              templateCode,
              disableSms: true,
              variables,
            },
          },
        ],
        allowDuplicates: false,
      }),
    });

    const rawBody = await response.text();
    let data: SolapiSendManyResponse | null = null;

    try {
      data = rawBody ? (JSON.parse(rawBody) as SolapiSendManyResponse) : null;
    } catch (parseError) {
      console.error("Failed to parse Solapi response", parseError, rawBody);
    }

    if (!response.ok) {
      const errorMessage = normalizeSolapiError(
        data?.errorMessage || data?.message || rawBody
      );
      console.error("Failed to send alimtalk:", data || rawBody);

      return {
        success: false,
        error: errorMessage,
      };
    }

    const failure = data?.failedMessageList?.find(
      (item) => item.to === formattedPhone
    );

    if (failure) {
      console.error("Solapi reported failed message:", failure);
      return {
        success: false,
        error: normalizeSolapiError(
          failure.statusMessage || failure.message || failure.statusCode
        ),
      };
    }

    const messageId = data?.groupInfo?.groupId || data?.groupInfo?.id;

    return {
      success: true,
      messageId,
    };
  } catch (error: any) {
    console.error("Failed to send alimtalk:", error);

    return {
      success: false,
      error: normalizeSolapiError(error.message),
    };
  }
}

/**
 * OTP 인증번호 알림톡 발송
 * @param phone 수신자 전화번호
 * @param otp 6자리 OTP
 * @returns 알림톡 발송 결과
 */
export async function sendOTPAlimtalk(
  phone: string,
  otp: string
): Promise<AlimtalkResult> {
  const templateCode = env.KAKAO_TEMPLATE_OTP || "otp_auth";

  return sendAlimtalkMessage({
    phone,
    templateCode,
    variables: {
      "#{OTP}": otp,
    },
  });
}

/**
 * 주문 확인 알림톡 발송
 */
export async function sendOrderConfirmationAlimtalk(
  phone: string,
  orderData: {
    orderId: string;
    customerName: string;
    totalAmount: number;
    productNames: string; // 예: "상품A 외 2건"
  }
): Promise<AlimtalkResult> {
  const templateCode =
    env.KAKAO_TEMPLATE_ORDER_CONFIRM || "order_confirmation";

  return sendAlimtalkMessage({
    phone,
    templateCode,
    variables: {
      "#{고객명}": orderData.customerName,
      "#{주문번호}": orderData.orderId,
      "#{상품명}": orderData.productNames,
      "#{결제금액}": `${orderData.totalAmount.toLocaleString()}원`,
    },
  });
}

/**
 * 배송 시작 알림톡 발송
 */
export async function sendShippingNotificationAlimtalk(
  phone: string,
  orderData: {
    orderId: string;
    customerName: string;
    shippingCompany: string;
    trackingNumber: string;
  }
): Promise<AlimtalkResult> {
  const templateCode = env.KAKAO_TEMPLATE_SHIPPING || "shipping_notification";

  return sendAlimtalkMessage({
    phone,
    templateCode,
    variables: {
      "#{고객명}": orderData.customerName,
      "#{주문번호}": orderData.orderId,
      "#{택배사}": orderData.shippingCompany,
      "#{송장번호}": orderData.trackingNumber,
    },
  });
}

/**
 * 주문 취소 알림톡 발송
 */
export async function sendPaymentCancellationAlimtalk(
  phone: string,
  orderData: {
    orderId: string;
    customerName: string;
    totalAmount: number;
    cancelReason?: string;
  }
): Promise<AlimtalkResult> {
  const templateCode = env.KAKAO_TEMPLATE_CANCEL || "order_cancellation";

  return sendAlimtalkMessage({
    phone,
    templateCode,
    variables: {
      "#{고객명}": orderData.customerName,
      "#{주문번호}": orderData.orderId,
      "#{환불금액}": `${orderData.totalAmount.toLocaleString()}원`,
      "#{취소사유}": orderData.cancelReason || "관리자 요청",
    },
  });
}

/**
 * 개발 모드: 콘솔에 알림톡 내용 출력 (실제 발송하지 않음)
 */
export async function sendOTPAlimtalk_DEV(
  phone: string,
  otp: string
): Promise<AlimtalkResult> {
  console.log("=".repeat(50));
  console.log("📱 [개발 모드] 카카오톡 알림톡 (실제 발송 안 함)");
  console.log(`수신자: ${phone}`);
  console.log(`인증번호: ${otp}`);
  console.log("유효시간: 5분");
  console.log("=".repeat(50));

  return {
    success: true,
    messageId: "dev_alimtalk_" + Date.now(),
  };
}

/**
 * 환경에 따라 적절한 알림톡 발송 함수 선택
 */
export function sendOTP(phone: string, otp: string): Promise<AlimtalkResult> {
  const isDevelopment =
    !hasRequiredAlimtalkConfig() || env.NODE_ENV === "development";

  if (isDevelopment) {
    return sendOTPAlimtalk_DEV(phone, otp);
  }

  return sendOTPAlimtalk(phone, otp);
}
