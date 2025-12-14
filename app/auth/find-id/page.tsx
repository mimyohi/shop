"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PhoneInput from "@/components/PhoneInput";
import OTPInput from "@/components/OTPInput";
import { validateAndFormatPhone } from "@/lib/phone/validation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function FindIdPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "result">("phone");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [foundAccounts, setFoundAccounts] = useState<Array<{ email: string; createdAt: string }>>([]);

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

  const handleSendOTP = async () => {
    setPhoneError("");
    setOtpError("");

    const validation = validateAndFormatPhone(phone);
    if (!validation.valid) {
      setPhoneError(validation.error || "올바른 전화번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setPhoneError(data.error || "OTP 발송에 실패했습니다.");
        return;
      }

      setStep("otp");
      setOtpCountdown(data.expiresIn || 300);
      setOtp("");
    } catch (err) {
      console.error("Send OTP error:", err);
      setPhoneError("인증번호 발송 중 오류가 발생했습니다.");
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
      // 먼저 OTP 검증
      const verifyResponse = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, flow: "find-id" }),
      });
      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.success) {
        setOtpError(verifyData.error || "인증에 실패했습니다.");
        return;
      }

      // 아이디 찾기 API 호출
      const findResponse = await fetch("/api/auth/find-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, verificationId: verifyData.verificationId }),
      });
      const findData = await findResponse.json();

      if (!findResponse.ok || !findData.success) {
        setOtpError(findData.error || "아이디 찾기에 실패했습니다.");
        return;
      }

      // 여러 계정이 있는 경우
      if (findData.accounts) {
        setFoundAccounts(findData.accounts);
      } else if (findData.email) {
        // 단일 계정인 경우
        setFoundAccounts([{ email: findData.email, createdAt: findData.createdAt }]);
      } else {
        setFoundAccounts([]);
      }
      setStep("result");
    } catch (err) {
      console.error("Find ID error:", err);
      setOtpError("아이디 찾기 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!domain) return email;

    if (local.length <= 3) {
      return `${local[0]}${"*".repeat(local.length - 1)}@${domain}`;
    }

    const visibleStart = local.slice(0, 3);
    const maskedPart = "*".repeat(Math.min(local.length - 3, 5));
    return `${visibleStart}${maskedPart}@${domain}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderContent = () => {
    // 결과 화면
    if (step === "result") {
      return (
        <div className="py-16 md:py-24">
          <div className="max-w-[360px] mx-auto px-4">
            <h1 className="text-center text-base font-medium mb-8">아이디 찾기</h1>

            {foundAccounts.length > 0 ? (
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    {foundAccounts.length > 1
                      ? `${foundAccounts.length}개의 계정이 발견되었습니다.`
                      : "가입된 아이디"}
                  </p>
                  <div className="space-y-4">
                    {foundAccounts.map((account, index) => (
                      <div
                        key={index}
                        className={`${foundAccounts.length > 1 ? "pb-4 border-b border-gray-200 last:border-0 last:pb-0" : ""}`}
                      >
                        <p className="text-lg font-semibold text-gray-900">
                          {maskEmail(account.email)}
                        </p>
                        {account.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            가입일: {formatDate(account.createdAt)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="block w-full py-3 bg-[#222222] text-white text-sm font-medium rounded hover:bg-[#111111] transition-colors text-center"
                  >
                    로그인하기
                  </Link>
                  <Link
                    href="/auth/forgot-password"
                    className="block w-full py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors text-center"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-gray-600">
                    해당 전화번호로 가입된 계정이 없습니다.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setStep("phone");
                      setPhone("");
                      setOtp("");
                    }}
                    className="w-full py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
                  >
                    다른 번호로 찾기
                  </button>
                  <Link
                    href="/auth/signup"
                    className="block w-full py-3 bg-[#222222] text-white text-sm font-medium rounded hover:bg-[#111111] transition-colors text-center"
                  >
                    회원가입하기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 기본 화면 (phone, otp)
    return (
      <div className="py-16 md:py-24">
        <div className="max-w-[360px] mx-auto px-4">
          <h1 className="text-center text-base font-medium mb-2">아이디 찾기</h1>
          <p className="text-center text-sm text-gray-500 mb-8">
            가입 시 등록한 전화번호로 아이디를 찾을 수 있습니다.
          </p>

          <div className="space-y-4">
            {step === "phone" && (
              <>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  disabled={loading}
                  error={phoneError}
                />
                <button
                  onClick={handleSendOTP}
                  disabled={loading || !phone}
                  className="w-full py-3 bg-[#222222] text-white text-sm font-medium rounded hover:bg-[#111111] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "발송 중..." : "인증번호 받기"}
                </button>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>{phone}</span>
                  <button
                    type="button"
                    className="text-[#222222] hover:underline"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                      setOtpError("");
                      setOtpCountdown(0);
                    }}
                  >
                    번호 변경
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
                    onClick={handleSendOTP}
                    disabled={loading || otpCountdown > 240}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {otpCountdown > 240
                      ? `재발송 (${formatCountdown(otpCountdown - 240)})`
                      : "재발송"}
                  </button>
                </div>
              </>
            )}
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
