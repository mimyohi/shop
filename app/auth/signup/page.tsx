'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PhoneInput from '@/components/PhoneInput';
import OTPInput from '@/components/OTPInput';
import { validateAndFormatPhone } from '@/lib/phone/validation';
import { signIn, signUp, supabaseAuth } from '@/lib/supabaseAuth';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  PRIVACY_COLLECTION_CONSENT,
} from '@/lib/terms';

type SignupStep = 'agreement' | 'form';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('agreement');

  // 약관 동의 상태
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
    sms: false,
    email: false,
  });

  // 약관 펼침 상태
  const [expandedTerms, setExpandedTerms] = useState({
    terms: false,
    privacy: false,
  });

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

  // 전체 동의 처리
  const handleAllAgreement = (checked: boolean) => {
    setAgreements({
      all: checked,
      terms: checked,
      privacy: checked,
      marketing: checked,
      sms: checked,
      email: checked,
    });
  };

  // 개별 동의 처리
  const handleAgreementChange = (key: keyof typeof agreements, checked: boolean) => {
    const newAgreements = { ...agreements, [key]: checked };

    // 마케팅 동의 시 SMS/이메일 모두 체크
    if (key === 'marketing') {
      newAgreements.sms = checked;
      newAgreements.email = checked;
    }

    // SMS 또는 이메일 하나라도 체크되면 마케팅 동의도 체크
    if (key === 'sms' || key === 'email') {
      newAgreements.marketing = newAgreements.sms || newAgreements.email;
    }

    // 전체 동의 상태 업데이트
    newAgreements.all =
      newAgreements.terms &&
      newAgreements.privacy &&
      newAgreements.marketing &&
      newAgreements.sms &&
      newAgreements.email;

    setAgreements(newAgreements);
  };

  // 약관 동의 다음 단계로
  const handleAgreementNext = () => {
    if (!agreements.terms || !agreements.privacy) {
      alert('필수 약관에 동의해주세요.');
      return;
    }
    setStep('form');
  };

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
              marketing_consent: agreements.marketing,
              sms_consent: agreements.sms,
              email_consent: agreements.email,
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

  const renderContent = () => {
    // 약관 동의 단계
    if (step === 'agreement') {
      return (
        <div className="py-16 md:py-24">
          <div className="max-w-[480px] mx-auto px-4">
            <h1 className="text-center text-base font-medium mb-8">회원가입</h1>

            {/* 스텝 인디케이터 */}
            <div className="flex items-center justify-center space-x-4 text-xs mb-8">
              <div className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-[#8B8B73] text-white flex items-center justify-center text-[10px] font-medium">1</span>
                <span className="ml-1.5 font-medium text-gray-900">약관동의</span>
              </div>
              <div className="w-6 h-px bg-gray-300"></div>
              <div className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-medium">2</span>
                <span className="ml-1.5 text-gray-400">정보입력</span>
              </div>
              <div className="w-6 h-px bg-gray-300"></div>
              <div className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-medium">3</span>
                <span className="ml-1.5 text-gray-400">가입완료</span>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-4">
              {/* 전체 동의 */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreements.all}
                    onChange={(e) => handleAllAgreement(e.target.checked)}
                    className="h-4 w-4 text-[#8B8B73] focus:ring-[#8B8B73] border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    모든 약관을 확인하고 전체 동의합니다.
                  </span>
                </label>
                <p className="mt-1 ml-7 text-xs text-gray-500">
                  (전체 동의는 필수 및 선택 정보에 대한 동의가 포함되어 있습니다.)
                </p>
              </div>

              {/* 이용약관 동의 (필수) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.terms}
                      onChange={(e) => handleAgreementChange('terms', e.target.checked)}
                      className="h-4 w-4 text-[#8B8B73] focus:ring-[#8B8B73] border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      이용약관 동의 <span className="text-red-500">(필수)</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpandedTerms({ ...expandedTerms, terms: !expandedTerms.terms })}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {expandedTerms.terms ? '접기' : '보기'}
                  </button>
                </div>
                {expandedTerms.terms && (
                  <div className="ml-7 p-3 bg-gray-50 rounded border border-gray-200 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans">
                      {TERMS_OF_SERVICE}
                    </pre>
                  </div>
                )}
              </div>

              {/* 개인정보 수집 및 이용 동의 (필수) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.privacy}
                      onChange={(e) => handleAgreementChange('privacy', e.target.checked)}
                      className="h-4 w-4 text-[#8B8B73] focus:ring-[#8B8B73] border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      개인정보 수집 및 이용 동의 <span className="text-red-500">(필수)</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpandedTerms({ ...expandedTerms, privacy: !expandedTerms.privacy })}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {expandedTerms.privacy ? '접기' : '보기'}
                  </button>
                </div>
                {expandedTerms.privacy && (
                  <div className="ml-7 p-3 bg-gray-50 rounded border border-gray-200 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans">
                      {PRIVACY_COLLECTION_CONSENT}
                      {'\n\n'}
                      {'='.repeat(50)}
                      {'\n\n'}
                      {PRIVACY_POLICY}
                    </pre>
                  </div>
                )}
              </div>

              {/* 쇼핑정보 수신 동의 (선택) */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreements.marketing}
                    onChange={(e) => handleAgreementChange('marketing', e.target.checked)}
                    className="h-4 w-4 text-[#8B8B73] focus:ring-[#8B8B73] border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    쇼핑정보 수신 동의 <span className="text-gray-400">(선택)</span>
                  </span>
                </label>

                {/* SMS / 이메일 수신 동의 */}
                <div className="ml-7 flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.sms}
                      onChange={(e) => handleAgreementChange('sms', e.target.checked)}
                      className="h-4 w-4 text-[#8B8B73] focus:ring-[#8B8B73] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">SMS</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.email}
                      onChange={(e) => handleAgreementChange('email', e.target.checked)}
                      className="h-4 w-4 text-[#8B8B73] focus:ring-[#8B8B73] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">이메일</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-8">
              <Link
                href="/"
                className="flex-1 py-3 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 text-center"
              >
                취소
              </Link>
              <button
                type="button"
                onClick={handleAgreementNext}
                disabled={!agreements.terms || !agreements.privacy}
                className="flex-1 py-3 text-sm font-medium rounded text-white bg-[#8B8B73] hover:bg-[#7a7a65] disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              이미 계정이 있으신가요?{' '}
              <Link href="/auth/login" className="text-[#8B8B73] font-medium hover:underline">
                로그인하기
              </Link>
            </p>
          </div>
        </div>
      );
    }

    // 정보 입력 단계
    return (
      <div className="py-16 md:py-24">
        <div className="max-w-[400px] mx-auto px-4">
          <h1 className="text-center text-base font-medium mb-8">회원가입</h1>

          {/* 스텝 인디케이터 */}
          <div className="flex items-center justify-center space-x-4 text-xs mb-8">
            <div className="flex items-center">
              <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="ml-1.5 text-gray-400">약관동의</span>
            </div>
            <div className="w-6 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <span className="w-5 h-5 rounded-full bg-[#8B8B73] text-white flex items-center justify-center text-[10px] font-medium">2</span>
              <span className="ml-1.5 font-medium text-gray-900">정보입력</span>
            </div>
            <div className="w-6 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-medium">3</span>
              <span className="ml-1.5 text-gray-400">가입완료</span>
            </div>
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* 전화번호 인증 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호 인증
              </label>
              <div className="border border-gray-200 rounded p-4 space-y-3 bg-gray-50">
                {phoneStep !== 'verified' && (
                  <>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      disabled={otpLoading}
                      error={phoneError}
                    />

                    {phoneStep === 'input' && (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpLoading || !phone}
                        className="w-full py-2.5 bg-[#8B8B73] text-white text-sm rounded hover:bg-[#7a7a65] disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                            className="text-[#8B8B73] hover:underline"
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

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={otpLoading || otp.length !== 6}
                            className="flex-1 py-2.5 bg-[#8B8B73] text-white text-sm rounded hover:bg-[#7a7a65] disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {otpLoading ? '확인 중...' : '인증하기'}
                          </button>
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={otpLoading || otpCountdown > 240}
                            className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {otpCountdown > 240 ? `재발송 (${formatCountdown(otpCountdown - 240)})` : '재발송'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {phoneStep === 'verified' && (
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-green-600">전화번호 인증 완료</p>
                      <p className="text-gray-600">{verifiedPhoneDisplay}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => resetPhoneVerification(true)}
                      className="text-[#8B8B73] hover:underline"
                    >
                      다른 번호 사용
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`w-full px-3 py-3 border-b text-sm placeholder-gray-400 focus:outline-none bg-transparent ${
                    emailStatus === 'exists' || emailStatus === 'error'
                      ? 'border-red-500'
                      : emailStatus === 'available'
                      ? 'border-green-500'
                      : 'border-gray-200 focus:border-gray-400'
                  }`}
                  placeholder="example@email.com"
                />
                {emailCheckLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {!emailCheckLoading && emailStatus === 'available' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {!emailCheckLoading && (emailStatus === 'exists' || emailStatus === 'error') && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              {emailMessage && (
                <p className={`mt-1 text-xs ${emailStatus === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                  {emailMessage}
                </p>
              )}
            </div>

            {/* 이름 */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-3 py-3 border-b border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 bg-transparent"
                placeholder="홍길동"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-3 py-3 border-b border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 bg-transparent"
                placeholder="최소 6자 이상"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-3 py-3 border-b border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 bg-transparent"
                placeholder="비밀번호 재입력"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('agreement')}
                className="flex-1 py-3 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                이전
              </button>
              <button
                type="submit"
                disabled={loading || phoneStep !== 'verified'}
                className="flex-1 py-3 text-sm font-medium rounded text-white bg-[#8B8B73] hover:bg-[#7a7a65] disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? '처리 중...' : '회원가입'}
              </button>
            </div>
            {phoneStep !== 'verified' && (
              <p className="text-center text-xs text-gray-500">
                회원가입을 완료하려면 전화번호 인증이 필요합니다.
              </p>
            )}
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}
