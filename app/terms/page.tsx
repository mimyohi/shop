import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { TERMS_OF_SERVICE } from '@/lib/terms';

export const metadata = {
  title: '이용약관 | MIMYOHI',
  description: '미묘히 이용약관',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4">
            {/* 제목 */}
            <h1 className="text-center text-base font-medium mb-10">이용약관</h1>

            {/* 이용약관 내용 */}
            <div className="border-t border-gray-200 pt-8">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                {TERMS_OF_SERVICE}
              </pre>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
