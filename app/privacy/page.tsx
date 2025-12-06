import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { PRIVACY_POLICY } from '@/lib/terms';

export const metadata = {
  title: '개인정보처리방침 | MIMYOHI',
  description: '미묘히 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4">
            {/* 제목 */}
            <h1 className="text-center text-base font-medium mb-2">개인정보처리방침</h1>
            <p className="text-center text-xs text-gray-500 mb-10">시행일: 2025-11-19</p>

            {/* 개인정보처리방침 내용 */}
            <div className="border-t border-gray-200 pt-8">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                {PRIVACY_POLICY}
              </pre>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
