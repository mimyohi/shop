import { SelectedAddon } from "./product.model";
import { SelectedOptionSetting, VisitType } from "./product-option.model";

/**
 * Orders 테이블 모델
 */
export type ConsultationStatus =
  | "chatting_required" // 접수 필요
  | "consultation_required" // 상담 필요
  | "on_hold" // 부재중
  | "consultation_completed" // 상담 완료
  | "shipping_on_hold" // 배송 보류
  | "shipped" // 배송됨
  | "cancelled"; // 취소됨

export interface Order {
  id: string;
  user_email: string;
  user_name: string;
  user_phone: string;
  total_amount: number;
  shipping_fee?: number;
  coupon_discount?: number;
  used_points?: number;
  status: string;
  consultation_status: ConsultationStatus;
  payment_key?: string;
  order_id: string;
  admin_memo?: string;
  created_at: string;
  updated_at: string;
  handled_at?: string | null;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_postal_code?: string;
  shipping_address?: string;
  shipping_address_detail?: string;
  shipping_company?: string;
  tracking_number?: string;
  shipped_at?: string | null;
  shipping_message?: string;
}

/**
 * OrderItems 테이블 모델
 */
export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  // Product Addons (추가상품)
  selected_addons?: SelectedAddon[] | null;
  // Product Options 관련 필드
  option_id?: string | null;
  option_name?: string | null;
  option_price?: number;
  visit_type?: VisitType | null;
  selected_option_settings?: SelectedOptionSetting[] | null;
  created_at: string;
}

/**
 * 공통 건강 상담 정보 필드 (다이어트/비만 치료 전문)
 */
export interface HealthConsultationDetails {
  // 1) 개인정보
  name: string; // 이름
  resident_number: string; // 주민등록번호
  phone: string; // 연락처

  // 2) 기본 신체 정보
  current_height: number; // 현재 키 (cm)
  current_weight: number; // 현재 체중 (kg)
  min_weight_since_20s: number; // 20대 이후 최저체중 (kg)
  max_weight_since_20s: number; // 20대 이후 최고체중 (kg)
  target_weight: number; // 희망 체중 (kg)
  target_weight_loss_period: string; // 희망 감량 기간

  // 3) 다이어트 경험
  previous_western_medicine: string; // 양약 복용 경험
  previous_herbal_medicine: string; // 한약 복용 경험
  previous_other_medicine: string; // 기타 복용 경험

  // 4) 생활 패턴
  occupation: string; // 직업
  work_hours: string; // 근무시간
  has_shift_work: boolean; // 교대근무 여부
  wake_up_time: string; // 기상 시간
  bedtime: string; // 취침 시간
  has_daytime_sleepiness: boolean; // 낮 졸림 여부
  meal_pattern: "1meals" | "2meals" | "3meals" | "irregular"; // 식사 패턴
  alcohol_frequency: "weekly_1_or_less" | "weekly_2_or_more"; // 음주 여부
  water_intake: "1L_or_less" | "over_1L"; // 음수량

  // 5) 원하는 다이어트 방향
  diet_approach: "sustainable" | "fast"; // 다이어트 방향
  preferred_stage: "stage1" | "stage2" | "stage3"; // 희망 단계

  // 6) 과거 병력 및 복용 약
  medical_history: string; // 과거 진단받았거나 현재 치료 중인 질환, 복용 중인 약
}

/**
 * OrderHealthConsultations 테이블 모델
 */
export interface OrderHealthConsultation extends HealthConsultationDetails {
  id: string;
  order_id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * UserHealthConsultations 테이블 모델
 */
export interface UserHealthConsultation extends HealthConsultationDetails {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * 식사 패턴 타입
 */
export type MealPattern = "1meals" | "2meals" | "3meals" | "irregular";

/**
 * 음주 빈도 타입
 */
export type AlcoholFrequency = "weekly_1_or_less" | "weekly_2_or_more";

/**
 * 음수량 타입
 */
export type WaterIntake = "1L_or_less" | "over_1L";

/**
 * 다이어트 방향 타입
 */
export type DietApproach = "sustainable" | "fast";

/**
 * 희망 단계 타입
 */
export type PreferredStage = "stage1" | "stage2" | "stage3";
