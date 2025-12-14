"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import OTPInput from "@/components/OTPInput";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const maskPhone = (phoneNumber: string) => {
    // +821012345678 -> 010-****-5678
    const national = phoneNumber.replace("+82", "0");
    if (national.length === 11) {
      return `${national.slice(0, 3)}-****-${national.slice(7)}`;
    }
    return phoneNumber;
  };

  const handleEmailSubmit = async () => {
    setEmailError("");

    if (!email || !email.includes("@")) {
      setEmailError("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 이메일로 사용자 조회 및 전화번호로 OTP 발송
      const response = await fetch("/api/auth/lookup-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setEmailError(data.error || "계정을 찾을 수 없습니다.");
        return;
      }

      setPhone(data.phone);
      setMaskedPhone(maskPhone(data.phone));
      setStep("otp");
      setOtpCountdown(data.expiresIn || 300);
      setOtp("");
    } catch (err) {
      console.error("Send OTP error:", err);
      setEmailError("인증번호 발송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/lookup-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setOtpError(data.error || "OTP 발송에 실패했습니다.");
        return;
      }

      setOtpCountdown(data.expiresIn || 300);
      setOtp("");
    } catch (err) {
      console.error("Resend OTP error:", err);
      setOtpError("인증번호 재발송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError("");

    if (otp.length !== 6) {
      setOtpError("6자리 인증번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // OTP 검증
      const verifyResponse = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, flow: "reset-password" }),
      });
      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.success) {
        setOtpError(verifyData.error || "인증에 실패했습니다.");
        return;
      }

      setVerificationId(verifyData.verificationId);
      setStep("reset");
    } catch (err) {
      console.error("Verify OTP error:", err);
      setOtpError("인증 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          verificationId,
          newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setPasswordError(data.error || "비밀번호 변경에 실패했습니다.");
        return;
      }

      setStep("success");
    } catch (err) {
      console.error("Reset password error:", err);
      setPasswordError("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (emailStr: string) => {
    const [local, domain] = emailStr.split("@");
    if (!domain) return emailStr;

    if (local.length <= 3) {
      return `${local[0]}${"*".repeat(local.length - 1)}@${domain}`;
    }

    const visibleStart = local.slice(0, 3);
    const maskedPart = "*".repeat(Math.min(local.length - 3, 5));
    return `${visibleStart}${maskedPart}@${domain}`;
  };

  const renderContent = () => {
    // 성공 화면
    if (step === "success") {
      return (
        <div className="py-16 md:py-24">
          <div className="max-w-[360px] mx-auto px-4 text-center">
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-base font-medium text-gray-900 mb-2">비밀번호가 변경되었습니다</h2>
              <p className="text-sm text-gray-600">
                새로운 비밀번호로 로그인해주세요.
              </p>
            </div>

            <Link
              href="/auth/login"
              className="block w-full py-3 bg-[#222222] text-white text-sm font-medium rounded hover:bg-[#111111] transition-colors text-center"
            >
              로그인하기
            </Link>
          </div>
        </div>
      );
    }

    // 비밀번호 재설정 화면
    if (step === "reset") {
      return (
        <div className="py-16 md:py-24">
          <div className="max-w-[360px] mx-auto px-4">
            <h1 className="text-center text-base font-medium mb-2">비밀번호 재설정</h1>
            <p className="text-center text-sm text-gray-500 mb-8">
              {maskEmail(email)} 계정의 새 비밀번호를 입력해주세요.
            </p>

            {passwordError && (
              <div className="mb-4 rounded-md bg-red-50 p-3">
                <div className="text-sm text-red-800">{passwordError}</div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-3 border-b border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 bg-transparent"
                  placeholder="최소 6자 이상"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-3 border-b border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 bg-transparent"
                  placeholder="비밀번호를 다시 입력해주세요"
                />
              </div>
              <div className="pt-4">
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full py-3 bg-[#222222] text-white text-sm font-medium rounded hover:bg-[#111111] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "변경 중..." : "비밀번호 변경"}
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // OTP 입력 화면
    if (step === "otp") {
      return (
        <div className="py-16 md:py-24">
          <div className="max-w-[360px] mx-auto px-4">
            <h1 className="text-center text-base font-medium mb-2">비밀번호 찾기</h1>
            <p className="text-center text-sm text-gray-500 mb-8">
              {maskedPhone}로 발송된 인증번호를 입력해주세요.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>{maskEmail(email)}</span>
                <button
                  type="button"
                  className="text-[#222222] hover:underline"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setOtpError("");
                    setOtpCountdown(0);
                  }}
                >
                  이메일 변경
                </button>
              </div>

              <OTPInput
                value={otp}
                onChange={setOtp}
                disabled={loading}
                error={otpError}
              />

              {otpCountdown > 0 && (
                <p className="text-center text-sm text-gray-500">
                  남은 시간:{" "}
                  <span className="font-semibold text-gray-900">
                    {formatCountdown(otpCountdown)}
                  </span>
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 py-3 bg-[#222222] text-white text-sm font-medium rounded hover:bg-[#111111] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "확인 중..." : "확인"}
                </button>
                <button
                  onClick={handleResendOTP}
                  disabled={loading || otpCountdown > 240}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {otpCountdown > 240
                    ? `재발송 (${formatCountdown(otpCountdown - 240)})`
                    : "재발송"}
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // 이메일 입력 화면 (기본)
    return (
      <div className="py-16 md:py-24">
        <div className="max-w-[360px] mx-auto px-4">
          <h1 className="text-center text-base font-medium mb-2">비밀번호 찾기</h1>
          <p className="text-center text-sm text-gray-500 mb-8">
            가입한 이메일을 입력하면 등록된 전화번호로 인증번호가 발송됩니다.
          </p>

          {emailError && (
            <div className="mb-4 rounded-md bg-red-50 p-3">
              <div className="text-sm text-red-800">{emailError}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-3 border-b border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 bg-transparent"
                placeholder="이메일 주소"
              />
            </div>
            <button
              onClick={handleEmailSubmit}
              disabled={loading || !email}
              className="w-full py-3 bg-[#222222] text-white text-sm font-medium rounded hover:bg-[#111111] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "확인 중..." : "인증번호 받기"}
            </button>
          </div>

          <div className="mt-8 text-center space-y-2">
            <Link
              href="/auth/find-id"
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              아이디(이메일)를 모르시나요?
            </Link>
            <Link
              href="/auth/login"
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              로그인으로 돌아가기
            </Link>
          </div>
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
