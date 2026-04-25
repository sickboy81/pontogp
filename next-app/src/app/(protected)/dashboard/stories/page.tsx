import DashboardStoriesClient from '@/components/DashboardStoriesClient'

export const metadata = {
  title: 'Stories',
  description: 'Gerencie o histórico de stories no CerejaVIP.',
}

export const dynamic = 'force-dynamic'

export default function DashboardStoriesPage() {
  return <DashboardStoriesClient />
}

