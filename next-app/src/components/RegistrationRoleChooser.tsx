'use client'

type RegistrationRole = 'advertiser' | 'user'

type RegistrationRoleChooserProps = {
  onSelect: (role: RegistrationRole) => void
}

const roles: Array<{
  role: RegistrationRole
  label: string
}> = [
  {
    role: 'advertiser',
    label: 'Sou Acompanhante',
  },
  {
    role: 'user',
    label: 'Sou Cliente',
  },
]

export default function RegistrationRoleChooser({
  onSelect,
}: RegistrationRoleChooserProps) {
  return (
    <div className="mt-6 grid grid-cols-2 rounded-xl border border-slate-600 bg-slate-900/50 p-1">
      {roles.map((item) => (
        <button
          key={item.role}
          type="button"
          onClick={() => onSelect(item.role)}
          className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
