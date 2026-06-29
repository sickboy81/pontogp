import DashboardStoriesClient from '@/components/DashboardStoriesClient'

export const metadata = {
  title: 'Cereja Stories',
  description: 'Gerencie o histórico das suas Cereja Stories no CerejaVIP.',
}

export const dynamic = 'force-dynamic'

export default function DashboardStoriesPage() {
  return <DashboardStoriesClient />
}

