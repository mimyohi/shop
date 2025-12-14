"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/models";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // slug가 있으면 slug 사용, 없으면 id 사용
  const productUrl = `/products/${product.slug || product.id}`;

  // 할인된 가격 계산
  const getDiscountedPrice = () => {
    if (!product.discount_rate || product.discount_rate === 0) {
      return product.price;
    }
    return Math.floor(product.price * (1 - product.discount_rate / 100));
  };

  const discountedPrice = getDiscountedPrice();
  const hasDiscount = product.discount_rate && product.discount_rate > 0;

  // DB에서 설정된 뱃지 여부 사용
  const isNew = product.is_new_badge ?? false;
  const isSale = product.is_sale_badge ?? false;
  const isOutOfStock = product.is_out_of_stock ?? false;

  return (
    <Link href={productUrl}>
      <div className="group cursor-pointer">
        {/* 이미지 영역 */}
        <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={product.image_url || "https://via.placeholder.com/400"}
            alt={product.name}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
              isOutOfStock ? "opacity-50" : ""
            }`}
          />

          {/* 품절 오버레이 */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-black text-sm px-4 py-2 font-medium">
                품절
              </span>
            </div>
          )}

          {/* 배지들 */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {isNew && (
              <span className="w-[47px] h-[26px] flex items-center justify-center bg-[#5ED1FF] text-white text-[10px] rounded-[10px] font-medium">
                NEW
              </span>
            )}
            {isSale && (
              <span className="w-[47px] h-[26px] flex items-center justify-center bg-[#55A6FD] text-white text-[10px] rounded-[10px] font-medium">
                SALE
              </span>
            )}
          </div>
        </div>

        {/* 상품 정보 */}
        <div className="mt-3">
          {/* 상품명 */}
          <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>

          {/* 상품 설명 */}
          {product.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">
              {product.description}
            </p>
          )}

          {/* 가격 */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">
              {discountedPrice.toLocaleString()}원
            </span>
            {hasDiscount === true && (
              <span className="text-xs text-gray-400 line-through">
                {product.price.toLocaleString()}원
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
