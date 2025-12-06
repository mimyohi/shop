"use client";

import { useEffect } from "react";

interface AddressData {
  zonecode: string; // 우편번호
  address: string; // 기본 주소
  addressEnglish?: string;
  addressType?: "R" | "J"; // R: 도로명, J: 지번
  bname?: string; // 법정동/법정리 이름
  buildingName?: string; // 건물명
}

interface AddressSearchProps {
  onComplete: (data: {
    postal_code: string;
    address: string;
  }) => void;
  buttonLabel?: string;
  buttonClassName?: string;
}

declare global {
  interface Window {
    daum: any;
  }
}

export default function AddressSearch({
  onComplete,
  buttonLabel = "우편번호 검색",
  buttonClassName = "px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition",
}: AddressSearchProps) {
  useEffect(() => {
    // Daum 우편번호 서비스 스크립트 로드
    const script = document.createElement("script");
    script.src =
      "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleSearch = () => {
    if (!window.daum) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: AddressData) {
        // 도로명 주소 또는 지번 주소를 사용
        const fullAddress = data.address;
        const extraAddress = data.buildingName || "";

        onComplete({
          postal_code: data.zonecode,
          address: extraAddress
            ? `${fullAddress} (${extraAddress})`
            : fullAddress,
        });
      },
      // 팝업 크기 설정
      width: "100%",
      height: "100%",
    }).open();
  };

  return (
    <button type="button" onClick={handleSearch} className={buttonClassName}>
      {buttonLabel}
    </button>
  );
}
