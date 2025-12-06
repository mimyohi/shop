'use client';

import Link from 'next/link';

interface CategoryCardProps {
  category: string;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/products?category=${encodeURIComponent(category)}`}
      className="border rounded-xl p-6 text-center transition-all group"
      style={{ borderColor: 'var(--chaeu-beige)', backgroundColor: 'var(--chaeu-cream)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--chaeu-sage-green)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(157, 181, 160, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--chaeu-cream)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
        📦
      </div>
      <h3 className="font-medium" style={{ color: 'var(--chaeu-dark)' }}>{category}</h3>
    </Link>
  );
}
