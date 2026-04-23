import DashboardPerfilForm from '@/components/DashboardPerfilForm'

export const metadata = {
  title: 'Editar perfil',
  description: 'Edite seu perfil no CerejaVIP.',
}

export const dynamic = 'force-dynamic'

export default function DashboardPerfilPage() {
  return <DashboardPerfilForm />
}
