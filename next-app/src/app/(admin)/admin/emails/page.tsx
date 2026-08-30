'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, Loader2, Mail, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

interface ProfileRow { id: string; name?: string; status?: string }
interface Preview { recipient: string; profileName: string; subject: string; html: string; text: string }

const TEMPLATES = [
  { id: 'profile-completion', label: 'Cadastro de anunciante incompleto', description: 'Convida uma anunciante com perfil em rascunho a finalizar o cadastro.' },
]

export default function AdminEmailsPage() {
  const params = useSearchParams()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [template, setTemplate] = useState(params.get('template') || 'profile-completion')
  const [profileId, setProfileId] = useState(params.get('profile') || '')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const drafts = useMemo(() => profiles.filter((profile) => profile.status === 'inactive'), [profiles])

  useEffect(() => {
    fetch('/api/admin/profiles?page=1&perPage=50', { credentials: 'include', cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { items?: ProfileRow[] } | null) => setProfiles(data?.items || []))
      .catch(() => toast.error('Não foi possível carregar as destinatárias.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!profileId || template !== 'profile-completion') { setPreview(null); return }
    setPreviewLoading(true)
    fetch(`/api/admin/profiles/${encodeURIComponent(profileId)}/reminder`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as Preview & { error?: string }
        if (!response.ok) throw new Error(data.error || 'Não foi possível gerar a prévia.')
        return data
      })
      .then(setPreview)
      .catch((error: unknown) => { setPreview(null); toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a prévia.') })
      .finally(() => setPreviewLoading(false))
  }, [profileId, template])

  const sendEmail = async () => {
    if (!preview || template !== 'profile-completion') return
    if (!window.confirm(`Enviar este email individualmente para ${preview.recipient}?`)) return
    setSending(true)
    try {
      const response = await fetch(`/api/admin/profiles/${encodeURIComponent(profileId)}/reminder`, { method: 'POST', credentials: 'include' })
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string }
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar o email.')
      toast.success(data.message || 'Email enviado individualmente.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar o email.')
    } finally { setSending(false) }
  }

  return (
    <div>
      <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar ao painel</Link>
      <div className="mb-8 flex items-start gap-3">
        <Mail className="mt-1 h-7 w-7 text-primary-400" />
        <div><h1 className="text-2xl font-bold text-white">Central de emails</h1><p className="mt-1 text-sm text-slate-400">Escolha um template, revise o conteúdo e envie para uma única destinatária.</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Templates</h2>
          {TEMPLATES.map((item) => <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`w-full rounded-lg border p-3 text-left ${template === item.id ? 'border-primary-400 bg-primary-500/10' : 'border-slate-700 hover:bg-slate-800'}`}><span className="text-sm font-semibold text-white">{item.label}</span><span className="mt-1 block text-xs text-slate-400">{item.description}</span></button>)}
        </aside>

        <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
          <div className="mb-5 flex items-center gap-2"><Eye className="h-5 w-5 text-primary-400" /><h2 className="text-lg font-semibold text-white">Revisar e enviar</h2></div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="recipient">Destinatária</label>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary-400" /> : <select id="recipient" value={profileId} onChange={(event) => setProfileId(event.target.value)} className="mb-5 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-white"><option value="">Selecione uma anunciante em rascunho</option>{drafts.map((profile) => <option key={profile.id} value={profile.id}>{profile.name || 'Sem nome'} — rascunho</option>)}</select>}
          {previewLoading && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Gerando prévia...</div>}
          {preview && !previewLoading && <>
            <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm"><p className="text-slate-400">Para: <span className="text-white">{preview.recipient}</span></p><p className="mt-1 text-slate-400">Assunto: <span className="text-white">{preview.subject}</span></p></div>
            <div className="overflow-hidden rounded-lg border border-slate-600 bg-white"><iframe title="Prévia do email" srcDoc={preview.html} sandbox="" className="h-[620px] w-full" /></div>
            <details className="mt-4 rounded-lg border border-slate-700 p-3"><summary className="cursor-pointer text-sm text-slate-300">Ver versão de texto</summary><pre className="mt-3 whitespace-pre-wrap text-xs text-slate-400">{preview.text}</pre></details>
            <button type="button" onClick={sendEmail} disabled={sending} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"><Send className="h-4 w-4" />{sending ? 'Enviando...' : 'Confirmar envio individual'}</button>
          </>}
          {!preview && !previewLoading && <p className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">Selecione uma destinatária para visualizar o email antes do envio.</p>}
        </section>
      </div>
    </div>
  )
}
