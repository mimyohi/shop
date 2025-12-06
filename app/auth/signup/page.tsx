'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PhoneInput from '@/components/PhoneInput';
import OTPInput from '@/components/OTPInput';
import { validateAndFormatPhone } from '@/lib/phone/validation';
import { signIn, signUp, supabaseAuth } from '@/lib/supabaseAuth';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp' | 'verified'>('input');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifiedPhoneE164, setVerifiedPhoneE164] = useState('');
  const [verifiedPhoneDisplay, setVerifiedPhoneDisplay] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);

  // 이메일 중복 확인 상태
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'exists' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // 이메일 중복 확인 함수
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email) {
      setEmailStatus('idle');
      setEmailMessage('');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailStatus('error');
      setEmailMessage('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setEmailStatus('checking');
    setEmailCheckLoading(true);

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setEmailStatus('error');
        setEmailMessage(data.error || '이메일 확인 중 오류가 발생했습니다.');
        return;
      }

      if (data.exists) {
        setEmailStatus('exists');
        setEmailMessage('이미 가입된 이메일입니다.');
      } else {
        setEmailStatus('available');
        setEmailMessage('사용 가능한 이메일입니다.');
      }
    } catch (err) {
      console.error('Email check error:', err);
      setEmailStatus('error');
      setEmailMessage('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    } finally {
      setEmailCheckLoading(false);
    }
  }, []);

  // 이메일 입력 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkEmailAvailability(formData.email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, checkEmailAvailability]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // 이메일 변경 시 상태 초기화
    if (name === 'email') {
      setEmailStatus('idle');
      setEmailMessage('');
    }
  };

  const resetPhoneVerification = (clearPhone = false) => {
    setOtp('');
    setPhoneError('');
    setOtpError('');
    setPhoneStep('input');
    setOtpCountdown(0);
    setVerifiedPhoneE164('');
    setVerifiedPhoneDisplay('');
    setVerificationId(null);
    if (clearPhone) {
      setPhone('');
    }
  };

  const handleSendOTP = async () => {
    setPhoneError('');
    setOtpError('');
    setVerificationId(null);

    const validation = validateAndFormatPhone(phone);
    if (!validation.valid) {
      setPhoneError(validation.error || '올바른 전화번호를 입력해주세요.');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setPhoneError(data.error || 'OTP 발송에 실패했습니다.');
        return;
      }

      setPhoneStep('otp');
      setOtpCountdown(data.expiresIn || 300);
      setOtp('');
    } catch (err) {
      console.error('Send OTP error:', err);
      setPhoneError('인증번호 발송 중 오류가 발생했습니다.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError('');

    if (otp.length !== 6) {
      setOtpError('6자리 인증번호를 입력해주세요.');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, flow: 'signup' }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setOtpError(data.error || '인증에 실패했습니다.');
        return;
      }

      setPhoneStep('verified');
      setVerifiedPhoneE164(data.phone);
      setVerifiedPhoneDisplay(phone);
      setVerificationId(data.verificationId);
      setOtpCountdown(0);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setOtpError('인증 처리 중 오류가 발생했습니다.');
    } finally {
      setOtpLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phoneStep !== 'verified' || !verifiedPhoneE164 || !verificationId) {
      setError('전화번호 인증을 완료해주세요.');
      return;
    }

    // 이메일 중복 확인
    if (emailStatus === 'exists') {
      setError('이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.');
      return;
    }

    if (emailStatus !== 'available') {
      setError('이메일 확인을 완료해주세요.');
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      {
        displayName: formData.displayName,
        phone: verifiedPhoneE164,
        phoneVerified: true,
      }
    );

    if (signUpError) {
      setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    } else {
      alert('회원가입이 완료되었습니다! 문진 정보를 먼저 입력해주세요.');
      const { data: signInData, error: autoLoginError } = await signIn(
        formData.email,
        formData.password
      );

      if (!autoLoginError && signInData?.user) {
        try {
          await supabaseAuth
            .from('user_profiles')
            .update({
              phone: verifiedPhoneE164,
              phone_verified: true,
              phone_verified_at: new Date().toISOString(),
            })
            .eq('user_id', signInData.user.id);
        } catch (profileError) {
          console.error('Failed to update phone info:', profileError);
        }
      }

      setLoading(false);
      if (autoLoginError) {
        const nextParam = encodeURIComponent('/profile?tab=health');
        router.push(`/auth/login?next=${nextParam}`);
      } else {
        router.push('/profile?tab=health');
        router.refresh();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 로고 */}
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-4xl font-bold text-gray-900">SHOP</h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              로그인하기
            </Link>
          </p>
        </div>

        {/* 회원가입 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 인증
              </label>
              <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
                {phoneStep !== 'verified' && (
                  <>
                    <PhoneInput
                      value={phone}
                      onChange={(value) => {
                        setPhone(value);
                      }}
                      disabled={otpLoading}
                      error={phoneError}
                    />

                    {phoneStep === 'input' && (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpLoading || !phone}
                        className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {otpLoading ? '발송 중...' : '인증번호 받기'}
                      </button>
                    )}

                    {phoneStep === 'otp' && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{phone}</span>
                          <button
                            type="button"
                            className="text-gray-700 hover:underline"
                            onClick={() => resetPhoneVerification(true)}
                          >
                            번호 변경
                          </button>
                        </div>

                        <OTPInput value={otp} onChange={setOtp} disabled={otpLoading} error={otpError} />

                        {otpCountdown > 0 && (
                          <p className="text-center text-sm text-gray-500">
                            남은 시간: <span className="font-semibold text-gray-900">{formatCountdown(otpCountdown)}</span>
                          </p>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={otpLoading || otp.length !== 6}
                            className="flex-1 bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {otpLoading ? '확인 중...' : '인증하기'}
                          </button>
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={otpLoading || otpCountdown > 240}
                            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {otpCountdown > 240
                              ? `재발송 가능 (${formatCountdown(otpCountdown - 240)})`
                              : '인증번호 재발송'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {phoneStep === 'verified' && (
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-green-600">전화번호 인증 완료</p>
                      <p className="text-gray-600">{verifiedPhoneDisplay}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => resetPhoneVerification(true)}
                      className="text-gray-700 hover:underline"
                    >
                      다른 번호 사용
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    emailStatus === 'exists' || emailStatus === 'error'
                      ? 'border-red-500'
                      : emailStatus === 'available'
                      ? 'border-green-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="example@email.com"
                />
                {emailCheckLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {!emailCheckLoading && emailStatus === 'available' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {!emailCheckLoading && (emailStatus === 'exists' || emailStatus === 'error') && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              {emailMessage && (
                <p className={`mt-1 text-sm ${
                  emailStatus === 'available' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {emailMessage}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                이름 (선택사항)
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="최소 6자 이상"
              />
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="비밀번호 재입력"
              />
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-medium text-gray-700">
                이용약관 및 개인정보처리방침에 동의합니다.
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || phoneStep !== 'verified'}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : '전화번호 인증 후 회원가입'}
            </button>
            {phoneStep !== 'verified' && (
              <p className="mt-2 text-center text-xs text-gray-500">
                회원가입을 완료하려면 전화번호 인증이 필요합니다.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
