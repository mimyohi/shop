'use client';

import { useEffect, useState } from 'react';
import { HealthConsultationDetails } from '@/models';
import PhoneInput from '@/components/PhoneInput';

interface HealthConsultationFormProps {
  onSubmit: (data: Partial<HealthConsultationDetails>) => void;
  initialData?: Partial<HealthConsultationDetails>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export default function HealthConsultationForm({
  onSubmit,
  initialData,
  submitLabel,
  isSubmitting = false,
}: HealthConsultationFormProps) {
  // 1) 개인정보
  const [name, setName] = useState(initialData?.name || '');
  const [residentNumber, setResidentNumber] = useState(initialData?.resident_number || '');
  const [phone, setPhone] = useState(initialData?.phone || '');

  // 2) 기본 신체 정보
  const [currentHeight, setCurrentHeight] = useState<number | ''>(
    initialData?.current_height || ''
  );
  const [currentWeight, setCurrentWeight] = useState<number | ''>(
    initialData?.current_weight || ''
  );
  const [minWeightSince20s, setMinWeightSince20s] = useState<number | ''>(
    initialData?.min_weight_since_20s || ''
  );
  const [maxWeightSince20s, setMaxWeightSince20s] = useState<number | ''>(
    initialData?.max_weight_since_20s || ''
  );
  const [targetWeight, setTargetWeight] = useState<number | ''>(
    initialData?.target_weight || ''
  );
  const [targetWeightLossPeriod, setTargetWeightLossPeriod] = useState(
    initialData?.target_weight_loss_period || ''
  );

  // 3) 다이어트 경험
  const [previousWesternMedicine, setPreviousWesternMedicine] = useState(
    initialData?.previous_western_medicine || ''
  );
  const [previousHerbalMedicine, setPreviousHerbalMedicine] = useState(
    initialData?.previous_herbal_medicine || ''
  );
  const [previousOtherMedicine, setPreviousOtherMedicine] = useState(
    initialData?.previous_other_medicine || ''
  );

  // 4) 생활 패턴
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [workHours, setWorkHours] = useState(initialData?.work_hours || '');
  const [hasShiftWork, setHasShiftWork] = useState(initialData?.has_shift_work || false);
  const [wakeUpTime, setWakeUpTime] = useState(initialData?.wake_up_time || '');
  const [bedtime, setBedtime] = useState(initialData?.bedtime || '');
  const [hasDaytimeSleepiness, setHasDaytimeSleepiness] = useState(
    initialData?.has_daytime_sleepiness || false
  );
  const [mealPattern, setMealPattern] = useState<
    '1meals' | '2meals' | '3meals' | 'irregular' | ''
  >(initialData?.meal_pattern || '');
  const [alcoholFrequency, setAlcoholFrequency] = useState<
    'weekly_1_or_less' | 'weekly_2_or_more' | ''
  >(initialData?.alcohol_frequency || '');
  const [waterIntake, setWaterIntake] = useState<'1L_or_less' | 'over_1L' | ''>(
    initialData?.water_intake || ''
  );

  // 5) 원하는 다이어트 방향
  const [dietApproach, setDietApproach] = useState<'sustainable' | 'fast' | ''>(
    initialData?.diet_approach || ''
  );
  const [preferredStage, setPreferredStage] = useState<'stage1' | 'stage2' | 'stage3' | ''>(
    initialData?.preferred_stage || ''
  );

  // 6) 과거 병력 및 복용 약
  const [medicalHistory, setMedicalHistory] = useState(initialData?.medical_history || '');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setResidentNumber(initialData.resident_number || '');
      setPhone(initialData.phone || '');
      setCurrentHeight(initialData.current_height || '');
      setCurrentWeight(initialData.current_weight || '');
      setMinWeightSince20s(initialData.min_weight_since_20s || '');
      setMaxWeightSince20s(initialData.max_weight_since_20s || '');
      setTargetWeight(initialData.target_weight || '');
      setTargetWeightLossPeriod(initialData.target_weight_loss_period || '');
      setPreviousWesternMedicine(initialData.previous_western_medicine || '');
      setPreviousHerbalMedicine(initialData.previous_herbal_medicine || '');
      setPreviousOtherMedicine(initialData.previous_other_medicine || '');
      setOccupation(initialData.occupation || '');
      setWorkHours(initialData.work_hours || '');
      setHasShiftWork(initialData.has_shift_work || false);
      setWakeUpTime(initialData.wake_up_time || '');
      setBedtime(initialData.bedtime || '');
      setHasDaytimeSleepiness(initialData.has_daytime_sleepiness || false);
      setMealPattern(initialData.meal_pattern || '');
      setAlcoholFrequency(initialData.alcohol_frequency || '');
      setWaterIntake(initialData.water_intake || '');
      setDietApproach(initialData.diet_approach || '');
      setPreferredStage(initialData.preferred_stage || '');
      setMedicalHistory(initialData.medical_history || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      resident_number: residentNumber,
      phone,
      current_height: currentHeight === '' ? undefined : Number(currentHeight),
      current_weight: currentWeight === '' ? undefined : Number(currentWeight),
      min_weight_since_20s: minWeightSince20s === '' ? undefined : Number(minWeightSince20s),
      max_weight_since_20s: maxWeightSince20s === '' ? undefined : Number(maxWeightSince20s),
      target_weight: targetWeight === '' ? undefined : Number(targetWeight),
      target_weight_loss_period: targetWeightLossPeriod,
      previous_western_medicine: previousWesternMedicine,
      previous_herbal_medicine: previousHerbalMedicine,
      previous_other_medicine: previousOtherMedicine,
      occupation,
      work_hours: workHours,
      has_shift_work: hasShiftWork,
      wake_up_time: wakeUpTime,
      bedtime,
      has_daytime_sleepiness: hasDaytimeSleepiness,
      meal_pattern: mealPattern || undefined,
      alcohol_frequency: alcoholFrequency || undefined,
      water_intake: waterIntake || undefined,
      diet_approach: dietApproach || undefined,
      preferred_stage: preferredStage || undefined,
      medical_history: medicalHistory,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1) 개인정보 */}
      <div className="border border-gray-200 rounded p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">1. 개인정보</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                주민등록번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={residentNumber}
                onChange={(e) => setResidentNumber(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                placeholder="000000-0000000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                연락처 <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                value={phone}
                onChange={(value) => setPhone(value)}
                placeholder="010-0000-0000"
                className="!py-2"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            ※ 본 정보는 의료기관 차트 작성·상담·택배 발송을 위한 필수 항목이며, 미기재 시 진료가
            어려울 수 있습니다.
          </p>
        </div>
      </div>

      {/* 2) 기본 신체 정보 */}
      <div className="border border-gray-200 rounded p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">2. 기본 신체 정보</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                현재 키 (cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={currentHeight}
                onChange={(e) => setCurrentHeight(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                placeholder="예: 170"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                현재 체중 (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                placeholder="예: 70"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">
              20대 이후 체중 변화 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">최저체중 (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={minWeightSince20s}
                  onChange={(e) =>
                    setMinWeightSince20s(e.target.value ? Number(e.target.value) : '')
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                  placeholder="예: 55"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">최고체중 (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={maxWeightSince20s}
                  onChange={(e) =>
                    setMaxWeightSince20s(e.target.value ? Number(e.target.value) : '')
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                  placeholder="예: 80"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                희망 체중 (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                placeholder="예: 60"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                희망 감량 기간 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={targetWeightLossPeriod}
                onChange={(e) => setTargetWeightLossPeriod(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                placeholder="예: 3개월, 6개월 등"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3) 다이어트 경험 */}
      <div className="border border-gray-200 rounded p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">3. 다이어트 경험</h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            이전에 비만약 복용 경험이 있나요? (가장 최근 복용 시기와 복용 기간을 함께
            작성해주세요.)
          </p>
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              양약 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={previousWesternMedicine}
              onChange={(e) => setPreviousWesternMedicine(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              placeholder="예: 2023년 3월 ~ 6월 (3개월), 또는 '없음'"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              한약 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={previousHerbalMedicine}
              onChange={(e) => setPreviousHerbalMedicine(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              placeholder="예: 2022년 1월 ~ 3월 (2개월), 또는 '없음'"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              기타 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={previousOtherMedicine}
              onChange={(e) => setPreviousOtherMedicine(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              placeholder="예: 건강기능식품, 다이어트 보조제 등, 또는 '없음'"
            />
          </div>
        </div>
      </div>

      {/* 4) 생활 패턴 */}
      <div className="border border-gray-200 rounded p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">4. 생활 패턴</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                직업 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                placeholder="예: 사무직, 학생, 자영업 등"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                근무시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                placeholder="예: 9시 ~ 18시"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">
              교대근무 여부 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shift_work"
                  checked={hasShiftWork === true}
                  onChange={() => setHasShiftWork(true)}
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-600">있음</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shift_work"
                  checked={hasShiftWork === false}
                  onChange={() => setHasShiftWork(false)}
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-600">없음</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                기상 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                취침 시간 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">
              낮 졸림 여부 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="daytime_sleepiness"
                  checked={hasDaytimeSleepiness === true}
                  onChange={() => setHasDaytimeSleepiness(true)}
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-600">있음</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="daytime_sleepiness"
                  checked={hasDaytimeSleepiness === false}
                  onChange={() => setHasDaytimeSleepiness(false)}
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-600">없음</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">
              식사 패턴 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: '1meals', label: '하루 1식' },
                { value: '2meals', label: '하루 2식' },
                { value: '3meals', label: '하루 3식' },
                { value: 'irregular', label: '불규칙' },
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="meal_pattern"
                    value={option.value}
                    checked={mealPattern === option.value}
                    onChange={(e) =>
                      setMealPattern(
                        e.target.value as '1meals' | '2meals' | '3meals' | 'irregular'
                      )
                    }
                    required
                    className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">
              음주 여부 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="alcohol_frequency"
                  value="weekly_1_or_less"
                  checked={alcoholFrequency === 'weekly_1_or_less'}
                  onChange={(e) =>
                    setAlcoholFrequency(e.target.value as 'weekly_1_or_less' | 'weekly_2_or_more')
                  }
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-600">주 1회 이하</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="alcohol_frequency"
                  value="weekly_2_or_more"
                  checked={alcoholFrequency === 'weekly_2_or_more'}
                  onChange={(e) =>
                    setAlcoholFrequency(e.target.value as 'weekly_1_or_less' | 'weekly_2_or_more')
                  }
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-600">주 2회 이상</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">
              음수량 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="water_intake"
                  value="1L_or_less"
                  checked={waterIntake === '1L_or_less'}
                  onChange={(e) => setWaterIntake(e.target.value as '1L_or_less' | 'over_1L')}
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-600">1L 이하</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="water_intake"
                  value="over_1L"
                  checked={waterIntake === 'over_1L'}
                  onChange={(e) => setWaterIntake(e.target.value as '1L_or_less' | 'over_1L')}
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-600">1L 초과</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 5) 원하는 다이어트 방향 */}
      <div className="border border-gray-200 rounded p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">5. 원하는 다이어트 방향</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-2">
              원하는 다이어트 방향 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-start">
                <input
                  type="radio"
                  name="diet_approach"
                  value="sustainable"
                  checked={dietApproach === 'sustainable'}
                  onChange={(e) => setDietApproach(e.target.value as 'sustainable' | 'fast')}
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500 mt-0.5"
                />
                <span className="ml-2 text-sm text-gray-600">
                  몸에 부담 없이, 무리 없는 지속 감량
                </span>
              </label>
              <label className="flex items-start">
                <input
                  type="radio"
                  name="diet_approach"
                  value="fast"
                  checked={dietApproach === 'fast'}
                  onChange={(e) => setDietApproach(e.target.value as 'sustainable' | 'fast')}
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500 mt-0.5"
                />
                <span className="ml-2 text-sm text-gray-600">
                  두근거림·항진감이 확실한 빠른 감량
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">
              희망 단계 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-start">
                <input
                  type="radio"
                  name="preferred_stage"
                  value="stage1"
                  checked={preferredStage === 'stage1'}
                  onChange={(e) =>
                    setPreferredStage(e.target.value as 'stage1' | 'stage2' | 'stage3')
                  }
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500 mt-0.5"
                />
                <span className="ml-2 text-sm text-gray-600">
                  1단계: 처음 복용 / 카페인 민감
                </span>
              </label>
              <label className="flex items-start">
                <input
                  type="radio"
                  name="preferred_stage"
                  value="stage2"
                  checked={preferredStage === 'stage2'}
                  onChange={(e) =>
                    setPreferredStage(e.target.value as 'stage1' | 'stage2' | 'stage3')
                  }
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500 mt-0.5"
                />
                <span className="ml-2 text-sm text-gray-600">
                  2단계: 복용 6개월 이하 / 카페인 민감
                </span>
              </label>
              <label className="flex items-start">
                <input
                  type="radio"
                  name="preferred_stage"
                  value="stage3"
                  checked={preferredStage === 'stage3'}
                  onChange={(e) =>
                    setPreferredStage(e.target.value as 'stage1' | 'stage2' | 'stage3')
                  }
                  required
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500 mt-0.5"
                />
                <span className="ml-2 text-sm text-gray-600">
                  3단계: 복용 6개월 이상 / 기존 처방 효과 미미
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 6) 과거 병력 및 복용 약 */}
      <div className="border border-gray-200 rounded p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">6. 과거 병력 및 복용 약</h3>

        <div>
          <label className="block text-sm text-gray-500 mb-1">
            과거 진단받았거나 현재 치료 중인 질환, 그리고 복용 중인 약을 모두 기재해주세요 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
            placeholder="예: 고혈압(혈압약 복용 중), 갑상선기능저하증(갑상선호르몬제 복용), 무릎 관절염 등, 또는 '없음'"
          />
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '저장 중...' : submitLabel || '문진 정보 저장'}
        </button>
      </div>
    </form>
  );
}
