import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "회사소개 | MIMYOHI",
  description: "미묘히 회사소개 - 여성의 흐름을 위한 웰니스 솔루션",
};

export default function AboutPage() {
  const companyInfo = [
    { label: "상점명", value: "미묘히" },
    { label: "대표이사", value: "정상원" },
    { label: "대표전화", value: "070-8655-2959", tel: "070-8655-2959" },
    { label: "주소", value: "서울 서초구 효령로 429 1414호 (서초동)" },
    { label: "사업자등록번호", value: "431-87-03798" },
    { label: "통신판매업신고", value: "기타" },
    {
      label: "개인정보 관리책임",
      value: "정상원",
      email: "official.mimyohi@gmail.com",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4">
            {/* 제목 */}
            <h1 className="text-center text-base font-medium mb-10">
              회사소개
            </h1>

            {/* 회사 정보 테이블 */}
            <div className="border-t border-gray-200">
              {companyInfo.map((info, index) => (
                <div key={index} className="flex border-b border-gray-200 py-4">
                  <div className="w-1/3 text-sm text-gray-500">
                    {info.label}
                  </div>
                  <div className="w-2/3 text-sm text-gray-900">
                    {info.tel ? (
                      <a
                        href={`tel:${info.tel}`}
                        className="text-[#8B8B73] hover:underline"
                      >
                        {info.value}
                      </a>
                    ) : info.email ? (
                      <span>
                        {info.value}
                        <a
                          href={`mailto:${info.email}`}
                          className="ml-2 text-[#8B8B73] hover:underline"
                        >
                          ({info.email})
                        </a>
                      </span>
                    ) : (
                      info.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
