"use client";

import { useState } from "react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

interface FAQAccordionProps {
  faqs: FAQ[];
}

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        등록된 FAQ가 없습니다.
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200">
      {faqs.map((faq, index) => (
        <div key={faq.id} className="border-b border-gray-200">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                Q
              </span>
              <span className="text-sm text-gray-900">{faq.question}</span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-4 ${
                openIndex === index ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {openIndex === index && (
            <div className="pb-4 pl-9">
              <div className="flex items-start gap-3">
                <p className="text-sm text-gray-600 leading-relaxed pt-0.5 whitespace-pre-wrap">
                  {faq.answer}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
