"use client";

import { useState, useEffect } from "react";
import { VisitType, SelectedOptionSetting } from "@/models";
import type {
  ProductOptionWithSettings,
  ProductOptionSetting,
  ProductOptionSettingType,
} from "@/repositories/product-options.repository";

interface Props {
  options: ProductOptionWithSettings[];
  basePrice: number;
  onSelectionChange: (
    option: ProductOptionWithSettings | null,
    visitType: VisitType | null,
    selectedSettings: SelectedOptionSetting[]
  ) => void;
  onOptionsLoaded?: (hasOptions: boolean) => void;
  resetTrigger?: number;
}

export default function ProductNewOptionsSelector({
  options,
  basePrice,
  onSelectionChange,
  onOptionsLoaded,
  resetTrigger,
}: Props) {
  // 방문 타입을 먼저 선택
  const [selectedVisitType, setSelectedVisitType] = useState<VisitType | null>(
    null
  );
  const [selectedOption, setSelectedOption] =
    useState<ProductOptionWithSettings | null>(null);
  const [selectedSettings, setSelectedSettings] = useState<
    Record<string, string>
  >({});

  // resetTrigger가 변경되면 선택 초기화
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setSelectedVisitType(null);
      setSelectedOption(null);
      setSelectedSettings({});
    }
  }, [resetTrigger]);

  // 옵션 로드 완료 시 부모에게 알림
  useEffect(() => {
    if (onOptionsLoaded) {
      onOptionsLoaded(options.length > 0);
    }
  }, [options.length, onOptionsLoaded]);

  // Check if settings should be shown based on visit type
  const shouldShowSettings = () => {
    if (!selectedOption || !selectedVisitType) return false;

    switch (selectedVisitType) {
      case "first":
        return selectedOption.use_settings_on_first;
      case "revisit_with_consult":
        return selectedOption.use_settings_on_revisit_with_consult;
      case "revisit_no_consult":
        return selectedOption.use_settings_on_revisit_no_consult;
      default:
        return false;
    }
  };

  // Notify parent of changes
  useEffect(() => {
    if (!selectedOption || !selectedVisitType) {
      onSelectionChange(null, null, []);
      return;
    }

    const settingsArray: SelectedOptionSetting[] = Object.entries(
      selectedSettings
    ).map(([settingId, typeId]) => {
      const setting = selectedOption.settings?.find((s) => s.id === settingId);
      const type = setting?.types?.find((t) => t.id === typeId);
      return {
        setting_id: settingId,
        setting_name: setting?.name || "",
        type_id: typeId,
        type_name: type?.name || "",
      };
    });

    onSelectionChange(selectedOption, selectedVisitType, settingsArray);
  }, [selectedOption, selectedVisitType, selectedSettings, onSelectionChange]);

  const handleVisitTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as VisitType;
    if (value) {
      setSelectedVisitType(value);
      setSelectedOption(null);
      setSelectedSettings({});
    }
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const optionId = e.target.value;
    const option = options.find((o) => o.id === optionId);
    if (option) {
      setSelectedOption(option);
      setSelectedSettings({});
    }
  };

  const handleSettingChange = (settingId: string, typeId: string) => {
    setSelectedSettings((prev) => ({
      ...prev,
      [settingId]: typeId,
    }));
  };

  if (options.length === 0) {
    return null;
  }

  const showSettings = shouldShowSettings();
  const visibleSettings = showSettings ? selectedOption?.settings || [] : [];

  return (
    <div className="space-y-3 border-t border-gray-200 pt-6">
      {/* 방문 타입 선택 (드롭다운) */}
      <div className="relative">
        <select
          value={selectedVisitType || ""}
          onChange={handleVisitTypeChange}
          className="w-full appearance-none bg-white border border-gray-300 rounded px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
        >
          <option value="">방문 타입을 선택해주세요</option>
          <option value="first">초진</option>
          <option value="revisit_with_consult">재진</option>
          <option value="revisit_no_consult">재진(상담X)</option>
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* 옵션 선택 (드롭다운) - 방문 타입 선택 후 표시 */}
      {selectedVisitType && (
        <div className="relative">
          <select
            value={selectedOption?.id || ""}
            onChange={handleOptionChange}
            className="w-full appearance-none bg-white border border-gray-300 rounded px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
          >
            <option value="">옵션을 선택해주세요</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} - {(basePrice + option.price).toLocaleString()}원
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      )}

      {/* 상세 설정 (드롭다운) - 옵션 선택 후 설정이 필요한 경우 */}
      {showSettings &&
        visibleSettings.map((setting) => (
          <div key={setting.id} className="relative">
            <select
              value={selectedSettings[setting.id] || ""}
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:border-gray-400"
            >
              <option value="">{setting.name}을(를) 선택해주세요</option>
              {setting.types?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        ))}
    </div>
  );
}
