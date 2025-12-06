'use client';

import { formatPhoneInput } from '@/lib/phone/validation';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  disabled = false,
  placeholder = '010-1234-5678',
  error,
  className = '',
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // 자동 포맷팅 적용
    const formatted = formatPhoneInput(input);
    onChange(formatted);
  };

  return (
    <div className="w-full">
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={13} // 010-1234-5678 (13자)
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
