"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchFormProps {
  initialQuery: string;
}

export default function SearchForm({ initialQuery }: SearchFormProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="검색어를 입력하세요"
          className="w-full px-4 py-3 pr-12 border-b border-gray-300 focus:border-[#222222] focus:outline-none text-sm"
        />
        <button
          type="submit"
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#222222]"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
