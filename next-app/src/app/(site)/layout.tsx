import SiteFrame from '@/components/SiteFrame'

export const dynamic = 'force-dynamic'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SiteFrame>{children}</SiteFrame>
}
