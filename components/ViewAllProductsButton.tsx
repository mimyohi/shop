'use client';

import Link from 'next/link';

export default function ViewAllProductsButton() {
  return (
    <Link
      href="/products"
      className="inline-block px-8 py-3 rounded-lg font-semibold transition-all"
      style={{ backgroundColor: 'var(--chaeu-sage-green)', color: 'var(--chaeu-white)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--chaeu-forest)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(157, 181, 160, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--chaeu-sage-green)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      전체 상품 보기
    </Link>
  );
}
