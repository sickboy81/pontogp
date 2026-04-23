import { Suspense } from 'react'
import MensagensClient from '@/components/MensagensClient'

export const metadata = {
  title: 'Mensagens',
  description: 'Suas conversas no CerejaVIP.',
}

export default function MensagensPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-400">Carregando...</div>}>
      <MensagensClient />
    </Suspense>
  )
}
