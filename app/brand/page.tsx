import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Brand | MIMYOHI",
  description: "미묘히 - 과정에서 피어나는 아름다움",
};

// ============================================
// 디자인 전환 플래그
// TODO
// true: 새로운 핑크 그라데이션 디자인
// false: 기존 디자인
// ============================================
const USE_NEW_DESIGN = true;

// 새로운 디자인 (핑크 그라데이션)
function NewBrandDesign() {
  return (
    <>
      {/* Hero Section - Two Column Layout */}
      <section className="min-h-[80vh] md:min-h-screen flex flex-col md:flex-row">
        {/* Left Side - Pink Gradient with Logo */}
        <div className="w-full md:w-2/5 min-h-[300px] md:min-h-full bg-gradient-to-b from-[#fce4ec] via-[#f8bbd9] to-[#f48fb1] flex items-center justify-center p-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif tracking-[0.15em] text-white drop-shadow-sm">
            MIMYOHI
          </h1>
        </div>

        {/* Right Side - Content */}
        <div className="w-full md:w-3/5 bg-gradient-to-br from-white to-[#fef7f9] flex flex-col justify-center p-8 md:p-12 lg:p-16">
          {/* Title Section */}
          <div className="text-center mb-12 md:mb-16">
            <p className="text-sm md:text-base text-gray-600 tracking-wider mb-2">
              THE BEAUTY THAT BLOOMS IN THE PROCESS
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium text-[#e91e63]">
              미묘히, 과정에서 피어나는 아름다움
            </h2>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 lg:p-12 border-l-4 border-[#f48fb1] max-w-2xl mx-auto">
            <div className="space-y-6 text-gray-700 text-sm md:text-base leading-relaxed">
              <p>
                세상에서 가장 부드러운 물이 단단한 바위를 이기는 이유는 흐름에
                있습니다.
                <br />
                물은 그저 자연스럽게 흘러가며, 시간이 지나면 바위도 물의 모양을
                따라 변해갑니다.
              </p>

              <p>
                우리의 몸도 강제로 틀을 맞추려 할 수록 저항이 생기고,
                <br />
                억지로 참으려 할 수록 반발이 커집니다.
              </p>

              <p>
                하지만 몸의 자연스러운 흐름을 따라 다채로운 변화를 채워가면
                놀랍도록 부드럽게, 그리고 확실
                <br />히 변화가 일어납니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// 기존 디자인
function OriginalBrandDesign() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-[#e8e4dc] bg-[url('/images/brand-hero.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-serif tracking-[0.2em] text-[#2c2c2c]">
            MIMYOHI
          </h1>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <h2 className="text-center text-xl md:text-2xl font-medium text-gray-900 mb-2">
            미묘히,
          </h2>
          <h2 className="text-center text-xl md:text-2xl font-medium text-gray-900 mb-12 md:mb-16">
            과정에서 피어나는 아름다움
          </h2>

          {/* Content */}
          <div className="space-y-8 md:space-y-10 text-center text-sm md:text-base leading-relaxed text-gray-700">
            <p className="text-gray-500 text-xs md:text-sm">
              미묘히 | 의료의 흐름을 설계하다
            </p>

            <div className="space-y-2">
              <p>미묘히는 여성건강의 진심이 환자에게 닿는 과정을</p>
              <p>
                조금 더 부드럽고, 편안하게 이어지도록 설계하는 브랜드입니다.
              </p>
            </div>

            <div className="space-y-2">
              <p>의료의 본질은 '사람'에 있습니다.</p>
              <p>미묘히는 그 본질이 흔들리지 않도록 시스템을 만듭니다.</p>
            </div>

            <div className="space-y-2">
              <p>
                진료의 시작부터 끝까지, 환자의 의료기관 사이에는 수많은 단계가
                존재합니다.
              </p>
              <p>예약, 접수, 상담, 조제, 출고, 그리고 일상의 복귀까지</p>
              <p>
                이 모든 순간을 하나의 리듬으로 이어주는 것이 우리의 역할입니다.
              </p>
            </div>

            <div className="space-y-2">
              <p>미묘히는 '전자상거래법'상 통신판매중개자로서,</p>
              <p>의료기관과 사용자가 신뢰할 수 있는 거래 구조를 제공합니다.</p>
            </div>

            <div className="space-y-2">
              <p>우리는 단순히 시스템을 구축하는 회사가 아닙니다.</p>
              <p>의료기관의 철학과 현실적인 운영 과제를 함께 고민하고,</p>
              <p>그 안에서 브랜드의 경험이 조화를 이루도록 설계합니다.</p>
            </div>

            <div className="space-y-2">
              <p>결제와 예약은 미묘히 플랫폼에서 안전하게 이뤄지고,</p>
              <p>진료와 약 조제·출고는 의료기관에서 직접 진행합니다.</p>
            </div>

            <div className="space-y-2">
              <p>이 분리된 시스템 덕분에 의료진은 진료에 집중하고,</p>
              <p>사용자는 안심하며 경험을 누릴 수 있습니다.</p>
            </div>

            <div className="space-y-2">
              <p>미묘히는 자사 브랜드 가치에 맞는 제품을 통신중개하며,</p>
              <p>의료기관과 사용자, 제품과 브랜드 사이의 복잡이</p>
              <p>조금 더 매끄럽게 연결되도록 이어지도록,</p>
              <p>운영과 경험의 리듬을 만들어갑니다.</p>
            </div>

            <div className="space-y-2 pt-4">
              <p className="font-medium text-gray-900">
                경험의 연결, 신뢰의 순환
              </p>
              <p>함께 설계하고, 함께 성장하는 파트너</p>
            </div>
          </div>

          {/* Notice Section */}
          <div className="mt-16 md:mt-20 pt-8 border-t border-gray-200">
            <h3 className="text-center text-sm font-medium text-gray-900 mb-6">
              [ 고지사항 ]
            </h3>
            <div className="text-center text-xs md:text-sm leading-relaxed text-gray-500 space-y-2">
              <p>미묘히는 '전자상거래법'상에 따른 통신판매중개자로서</p>
              <p>
                의약품·한약 등의 제조·조제 및 판매에 직접 관여하지 않습니다.
              </p>
              <p>
                모든 진료 및 약 처방, 출고는 해당 의료기관에서 직접 진행합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        {USE_NEW_DESIGN ? <NewBrandDesign /> : <OriginalBrandDesign />}
      </main>
      <Footer />
    </div>
  );
}
