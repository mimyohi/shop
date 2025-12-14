'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // 값을 배열로 변환
  const valueArray = value.split('').slice(0, length);
  while (valueArray.length < length) {
    valueArray.push('');
  }

  const handleChange = (index: number, newValue: string) => {
    // 숫자만 허용
    if (newValue && !/^\d$/.test(newValue)) {
      return;
    }

    const newArray = [...valueArray];
    newArray[index] = newValue;
    onChange(newArray.join(''));

    // 다음 입력란으로 포커스 이동
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace
    if (e.key === 'Backspace' && !valueArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // 좌우 화살표
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);

    // 마지막 입력란으로 포커스
    if (pastedData.length === length) {
      inputRefs.current[length - 1]?.focus();
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center gap-2">
        {valueArray.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            disabled={disabled}
            className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition focus:outline-none ${
              error
                ? 'border-gray-900'
                : focusedIndex === index
                ? 'border-black'
                : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-gray-700 text-center">{error}</p>}
    </div>
  );
}
