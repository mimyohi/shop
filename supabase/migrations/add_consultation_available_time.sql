-- Add consultation_available_time column to user_health_consultations and order_health_consultation tables

BEGIN;

-- Add column to user_health_consultations
ALTER TABLE user_health_consultations
ADD COLUMN IF NOT EXISTS consultation_available_time TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN user_health_consultations.consultation_available_time IS '상담 가능한 시간대 (주관식)';

-- Add column to order_health_consultation
ALTER TABLE order_health_consultation
ADD COLUMN IF NOT EXISTS consultation_available_time TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN order_health_consultation.consultation_available_time IS '상담 가능한 시간대 (주관식)';

COMMIT;
