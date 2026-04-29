'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FaqItem = { question: string; answer: string }

function FAQItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-800/50 transition-colors">
        <span className="text-lg font-medium text-white pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-6 pb-6"><p className="text-slate-400 leading-relaxed">{answer}</p></div>}
    </div>
  )
}

export default function AnunciantesFaq({ items }: { items: FaqItem[] }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {items.map((faq, index) => (
        <FAQItem
          key={index}
          question={faq.question}
          answer={faq.answer}
          open={faqOpen === index}
          onToggle={() => setFaqOpen(faqOpen === index ? null : index)}
        />
      ))}
    </div>
  )
}
