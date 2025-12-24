import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Brand | MIMYOHI",
  description: "미묘히 - 과정에서 피어나는 아름다움",
};

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full">
          {/* Mobile Image */}
          <div className="block md:hidden">
            <Image
              src="/brand/brand_mobile.png"
              alt="MIMYOHI Brand"
              width={750}
              height={1000}
              className="w-full h-auto"
              priority
            />
          </div>
          {/* PC Image */}
          <div className="hidden md:block">
            <Image
              src="/brand/brand_pc.png"
              alt="MIMYOHI Brand"
              width={1920}
              height={600}
              className="w-full h-auto"
              priority
            />
          </div>
        </section>

        {/* Brand Story Section */}
        <section
          className="py-16 md:py-24 px-4"
          style={{
            background:
              "linear-gradient(to bottom, #FFFFFF 0%, #F3FFFC 100%)",
          }}
        >
          <div className="max-w-3xl mx-auto">
            {/* Title - PC */}
            <h2 className="hidden md:block text-center text-2xl md:text-3xl font-medium text-gray-900 mb-8">
              미묘히 | 의료의 흐름을 설계하다
            </h2>
            {/* Title - Mobile */}
            <div className="md:hidden text-center mb-8">
              <h2 className="text-xl font-medium text-gray-900">미묘히,</h2>
              <h2 className="text-xl font-medium text-gray-900">
                과정에서 피어나는 아름다움
              </h2>
            </div>

            {/* Subtitle - Mobile */}
            <p className="md:hidden text-center text-sm text-gray-500 mb-8">
              미묘히 | 의료의 흐름을 설계하다
            </p>

            {/* Intro */}
            <div className="text-center text-sm md:text-base leading-relaxed text-gray-600 mb-12 md:mb-16">
              <p>미묘히는 의료진의 진심이 환자에게 닿는 과정을</p>
              <p>
                조금 더 부드럽고, 편안하게 이어지도록 설계하는 브랜드입니다.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-12 md:mb-16">
              <h3 className="text-center text-base md:text-lg font-medium text-gray-800 mb-6 md:mb-8">
                <span className=" pb-1">
                  &ldquo;미묘히는 본질이 흔들리지 않도록 시스템을
                  만듭니다.&rdquo;
                </span>
              </h3>
              <div className="text-center text-sm md:text-base leading-relaxed text-gray-600 space-y-1">
                <p>의료의 본질은 언제나 사람에 있습니다.</p>
                <p>그래서 미묘히는 그 본질이 과정 속에서 흔들리지 않도록,</p>
                <p>보이지 않는 시스템부터 정교하게 설계합니다.</p>
              </div>
              <div className="text-center text-sm md:text-base leading-relaxed text-gray-600 space-y-1 mt-6">
                <p>
                  진료의 시작부터 완성까지, 환자와 의료기관 사이에는 수많은
                  단계가 존재합니다.
                </p>
                <p>예약, 결제, 상담, 조제, 출고, 그리고 일상의 복귀까지.</p>
                <p>
                  이 모든 순간을 하나의 리듬으로 이어주는 것이 우리의
                  역할입니다.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="mb-12 md:mb-16">
              <h3 className="text-center text-base md:text-lg font-medium text-gray-800 mb-6 md:mb-8">
                <span className="  pb-1">
                  &ldquo;의료기관과 사용자가 신뢰할 수 있는 거래 구조를
                  제공합니다.&rdquo;
                </span>
              </h3>
              <div className="text-center text-sm md:text-base leading-relaxed text-gray-600 space-y-1">
                <p>미묘히는 &lsquo;전자상거래법&rsquo;상 통신판매중개자로서,</p>
                <p>
                  의료기관과 사용자가 모두 신뢰할 수 있는 거래 구조를
                  제공합니다.
                </p>
              </div>
              <div className="text-center text-sm md:text-base leading-relaxed text-gray-600 space-y-1 mt-6">
                <p>우리는 단순히 시스템을 구축하는 회사가 아니라,</p>
                <p>의료기관의 철학과 현실적인 운영 과제를 함께 고민하며,</p>
                <p>그 안에서 브랜드와 경험이 조화를 이루도록 설계합니다.</p>
              </div>
              <div className="text-center text-sm md:text-base leading-relaxed text-gray-600 space-y-1 mt-6">
                <p>결제와 예약은 미묘히 플랫폼에서 안전하게 이루어지고,</p>
                <p>진료와 약 조제·출고는 의료기관에서 직접 진행합니다.</p>
              </div>
              <div className="text-center text-sm md:text-base leading-relaxed text-gray-600 space-y-1 mt-6">
                <p>이 분리된 시스템 덕분에 의료진은 진료에 집중하고,</p>
                <p>사용자는 안심하며 경험을 누릴 수 있습니다.</p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mb-12 md:mb-16">
              <h3 className="text-center text-base md:text-lg font-medium text-gray-800 mb-6 md:mb-8">
                <span className=" pb-1">
                  &ldquo;운영과 경험의 리듬을 만들어갑니다.&rdquo;
                </span>
              </h3>
              <div className="text-center text-sm md:text-base leading-relaxed text-gray-600 space-y-1">
                <p>미묘히는 자사 브랜드 가치에 맞는 제품을 통신중개하며,</p>
                <p>의료기관과 사용자, 제품과 브랜드 사이의 연결이</p>
                <p>조금 더 부드럽고 따뜻하게 이어지도록,</p>
                <p>운영과 경험의 리듬을 만들어갑니다.</p>
              </div>
              <div className="text-center text-sm md:text-base leading-relaxed text-gray-600 space-y-1 mt-8">
                <p className="font-medium text-gray-800">
                  경험의 연결, 신뢰의 완성
                </p>
                <p>함께 설계하고, 함께 성장하는 파트너</p>
              </div>
            </div>

            {/* Notice Section */}
            <div className="pt-8 ">
              <h3 className="text-center text-sm font-medium text-gray-900 mb-6">
                [고지사항]
              </h3>
              <div className="text-center text-xs md:text-sm leading-relaxed text-gray-500 space-y-1">
                <p>
                  미묘히는 &lsquo;전자상거래법&rsquo;에 따른 통신판매중개자로서
                </p>
                <p>
                  의약품·한약 등의 제조·조제 및 판매에 직접 관여하지 않습니다.
                </p>
                <p>
                  모든 진료 및 약 처방, 출고는 해당 의료기관에서 직접
                  진행합니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
