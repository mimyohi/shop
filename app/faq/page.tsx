import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import FAQAccordion from './FAQAccordion';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

async function getFAQs(): Promise<FAQ[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }

  return data || [];
}

export default async function FaqPage() {
  const faqs = await getFAQs();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4">
            {/* 제목 */}
            <h1 className="text-center text-base font-medium mb-2">자주묻는질문</h1>
            <p className="text-center text-xs text-gray-500 mb-10">이용안내 FAQ입니다.</p>

            {/* FAQ 아코디언 */}
            <FAQAccordion faqs={faqs} />

            {/* 추가 문의 안내 */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-900 mb-1">더 궁금한 점이 있으신가요?</p>
              <p className="text-xs text-gray-500 mb-4">
                고객센터로 문의해 주시면 친절히 안내해 드리겠습니다.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <a href="tel:070-8655-2959" className="text-[#222222] hover:underline">
                  070-8655-2959
                </a>
                <span className="text-gray-300">|</span>
                <a href="mailto:official.mimyohi@gmail.com" className="text-[#222222] hover:underline">
                  official.mimyohi@gmail.com
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                평일 10:00~18:00 / 토요일 10:00~15:00
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
