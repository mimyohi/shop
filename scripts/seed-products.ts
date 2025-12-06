import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { env } from '../env';

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = ['전자기기', '액세서리', '패션', '뷰티', '홈데코', '스포츠'];

const mockProducts = [
  // 전자기기
  { name: '무선 이어폰 Pro', description: '노이즈 캔슬링 기능이 탑재된 프리미엄 무선 이어폰', category: '전자기기', price: 189000, stock: 50, image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400' },
  { name: '스마트 워치', description: '건강 모니터링과 다양한 운동 모드 지원', category: '전자기기', price: 259000, stock: 30, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
  { name: '무선 충전기', description: '빠른 충전 속도를 자랑하는 무선 충전 패드', category: '전자기기', price: 35000, stock: 100, image_url: 'https://images.unsplash.com/photo-1591290619762-d71b2f5312b8?w=400' },
  { name: '블루투스 스피커', description: '360도 사운드로 어디서나 최상의 음질', category: '전자기기', price: 79000, stock: 45, image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' },
  { name: '노트북 거치대', description: '각도 조절이 가능한 알루미늄 거치대', category: '전자기기', price: 42000, stock: 8, image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400' },
  { name: '웹캠 HD', description: '1080p 고화질 웹캠, 재택근무 필수품', category: '전자기기', price: 68000, stock: 25, image_url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400' },

  // 액세서리
  { name: '가죽 카드지갑', description: '프리미엄 천연 가죽 미니멀 카드지갑', category: '액세서리', price: 45000, stock: 60, image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400' },
  { name: '선글라스 클래식', description: 'UV 차단 100%, 클래식한 디자인', category: '액세서리', price: 89000, stock: 35, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
  { name: '크로스백', description: '데일리로 활용하기 좋은 심플한 크로스백', category: '액세서리', price: 125000, stock: 20, image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' },
  { name: '실버 목걸이', description: '925 실버 미니멀 펜던트 목걸이', category: '액세서리', price: 78000, stock: 15, image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400' },
  { name: '손목시계 메탈', description: '스테인리스 스틸 쿼츠 시계', category: '액세서리', price: 156000, stock: 12, image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400' },
  { name: '벨트 가죽', description: '이탈리아 송아지 가죽 벨트', category: '액세서리', price: 92000, stock: 40, image_url: 'https://images.unsplash.com/photo-1624222247344-550fb60583bb?w=400' },

  // 패션
  { name: '오버핏 후디', description: '부드러운 코튼 소재의 편안한 후디', category: '패션', price: 59000, stock: 80, image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400' },
  { name: '데님 팬츠', description: '클래식한 핏의 데님 팬츠', category: '패션', price: 79000, stock: 55, image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' },
  { name: '화이트 티셔츠 3종', description: '베이직 화이트 티셔츠 3장 세트', category: '패션', price: 35000, stock: 120, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
  { name: '롱 코트', description: '울 혼방 소재 롱 코트', category: '패션', price: 189000, stock: 18, image_url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400' },
  { name: '스니커즈 화이트', description: '캐주얼 화이트 스니커즈', category: '패션', price: 98000, stock: 65, image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
  { name: '야구 모자', description: '심플한 디자인의 볼캡', category: '패션', price: 28000, stock: 90, image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400' },

  // 뷰티
  { name: '수분 크림', description: '24시간 수분 유지 페이스 크림', category: '뷰티', price: 45000, stock: 70, image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400' },
  { name: '비타민C 세럼', description: '피부 톤업에 효과적인 고농축 세럼', category: '뷰티', price: 52000, stock: 5, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400' },
  { name: '립스틱 세트', description: '데일리 립스틱 5종 세트', category: '뷰티', price: 68000, stock: 42, image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400' },
  { name: '선크림 SPF50+', description: '끈적임 없는 가벼운 선크림', category: '뷰티', price: 32000, stock: 95, image_url: 'https://images.unsplash.com/photo-1556228852-80c227cbb010?w=400' },
  { name: '헤어 에센스', description: '손상모 케어 헤어 에센스', category: '뷰티', price: 38000, stock: 58, image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400' },

  // 홈데코
  { name: '아로마 디퓨저', description: '은은한 향기가 퍼지는 디퓨저 세트', category: '홈데코', price: 42000, stock: 48, image_url: 'https://images.unsplash.com/photo-1602874801006-95806090069a?w=400' },
  { name: '북유럽 쿠션', description: '소파를 더욱 아늑하게, 북유럽 스타일 쿠션', category: '홈데코', price: 25000, stock: 75, image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400' },
  { name: '벽시계 모던', description: '심플한 디자인의 모던 벽시계', category: '홈데코', price: 68000, stock: 22, image_url: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400' },
  { name: '화분 세트', description: '공기정화 식물 3종과 화분 세트', category: '홈데코', price: 45000, stock: 35, image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400' },
  { name: 'LED 무드등', description: '색상 조절 가능한 무선 무드등', category: '홈데코', price: 38000, stock: 60, image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400' },

  // 스포츠
  { name: '요가 매트', description: '미끄럼 방지 기능이 있는 두꺼운 요가 매트', category: '스포츠', price: 45000, stock: 85, image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400' },
  { name: '덤벨 세트', description: '2kg, 3kg, 5kg 덤벨 세트', category: '스포츠', price: 78000, stock: 28, image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400' },
  { name: '러닝화', description: '쿠션감이 좋은 전문 러닝화', category: '스포츠', price: 128000, stock: 42, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
  { name: '물통 스테인리스', description: '보온/보냉 기능 스테인리스 물통 1L', category: '스포츠', price: 32000, stock: 105, image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400' },
];

async function seedProducts() {
  console.log('Starting to seed products...');

  for (const product of mockProducts) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        is_visible_on_main: true,
        slug: product.name.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error(`Error inserting ${product.name}:`, error);
    } else {
      console.log(`✓ Added: ${product.name}`);
    }

    // 요청 속도 제한을 위한 짧은 대기
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n✨ Finished seeding products!');
  console.log(`Total products added: ${mockProducts.length}`);
}

seedProducts().catch(console.error);
