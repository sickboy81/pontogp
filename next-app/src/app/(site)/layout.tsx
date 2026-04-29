import SiteFrame from '@/components/SiteFrame'
import { Suspense } from 'react'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<main className="min-h-screen">{children}</main>}>
      <SiteFrame>{children}</SiteFrame>
    </Suspense>
  )
}
