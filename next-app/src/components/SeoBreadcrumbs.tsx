import Link from 'next/link'

export type SeoBreadcrumbItem = {
  label: string
  href?: string
}

export default function SeoBreadcrumbs({ items }: { items: SeoBreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 text-xs text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-primary-300">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-slate-300' : undefined}>{item.label}</span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
