'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, Loader2, Mail, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

interface ProfileRow { id: string; name?: string; status?: string; city?: string; publication_reasons?: string[]; owner_email?: string; owner_role?: string; search_expires_at?: string; contact_expires_at?: string }
interface Preview { recipient: string; from?: string; profileName: string; subject: string; html: string; text: string; lastSentAt?: string | null; cooldown?: { allowed: boolean; remainingHours: number } }
interface HistoryItem { id: string; template?: string; recipient_email?: string; subject?: string; status?: string; created?: string; expand?: { profile?: { name?: string }; sender_admin?: { email?: string } } }
type TemplateOverride = { subject: string; body: string }

const TEMPLATES = [
  { id: 'profile-completion', label: 'Cadastro de anunciante incompleto', description: 'Convida uma anunciante com perfil em rascunho a finalizar o cadastro.', audience: 'Anunciantes com perfil em rascunho', cooldownDays: 7 },
  { id: 'plan-expiring', label: 'Plano próximo do vencimento', description: 'Lembra a anunciante de renovar antes de perder visibilidade.', audience: 'Planos que vencem nos próximos 7 dias', cooldownDays: 3 },
  { id: 'plan-expired', label: 'Plano vencido', description: 'Convida a anunciante a renovar um plano já vencido.', audience: 'Anunciantes com plano vencido', cooldownDays: 7 },
  { id: 'profile-suspended', label: 'Perfil suspenso', description: 'Informa sobre a suspensão e orienta a revisão do perfil.', audience: 'Anunciantes com perfil suspenso', cooldownDays: 7 },
  { id: 'payment-confirmation', label: 'Confirmação de pagamento', description: 'Confirma manualmente o recebimento de um pagamento.', audience: 'Anunciante selecionada pelo admin', cooldownDays: 0 },
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
  const [search, setSearch] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [logsConfigured, setLogsConfigured] = useState(true)
  const [resendConfigured, setResendConfigured] = useState(true)
  const [recipientPage, setRecipientPage] = useState(1)
  const [recipientTotal, setRecipientTotal] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [nowMs, setNowMs] = useState(0)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const [templateOverrides, setTemplateOverrides] = useState<Record<string, TemplateOverride>>({})
  const [editingTemplate, setEditingTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyStatus, setHistoryStatus] = useState('')
  const [historyTemplate, setHistoryTemplate] = useState('')

  useEffect(() => { setNowMs(Date.now()) }, [])

  useEffect(() => {
    if (!confirmOpen) return
    cancelButtonRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setConfirmOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [confirmOpen])

  const recipients = useMemo(() => profiles.filter((profile) => {
    if (profile.owner_role !== 'advertiser') return false
    if (template === 'profile-completion') return profile.status === 'inactive'
    if (template === 'profile-suspended') return profile.status === 'suspended'
    if (template === 'plan-expiring' || template === 'plan-expired') {
      const date = profile.search_expires_at ? new Date(profile.search_expires_at).getTime() : NaN
      if (Number.isNaN(date)) return false
      if (!nowMs) return false
      const days = Math.ceil((date - nowMs) / 86400000)
      return template === 'plan-expiring' ? days >= 0 && days <= 7 : days < 0
    }
    return true
  }), [nowMs, profiles, template])

  useEffect(() => {
    fetch(`/api/admin/profiles?page=${recipientPage}&perPage=20&q=${encodeURIComponent(search)}`, { credentials: 'include', cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { items?: ProfileRow[]; totalItems?: number } | null) => { setProfiles(data?.items || []); setRecipientTotal(data?.totalItems || 0) })
      .catch(() => toast.error('Não foi possível carregar as destinatárias.'))
      .finally(() => setLoading(false))
  }, [recipientPage, search])

  useEffect(() => {
    fetch(`/api/admin/emails?page=${historyPage}&perPage=10${historyStatus ? `&status=${historyStatus}` : ''}${historyTemplate ? `&template=${historyTemplate}` : ''}`, { credentials: 'include', cache: 'no-store' })
      .then((response) => response.json())
      .then((data: { items?: HistoryItem[]; totalItems?: number; configured?: boolean; resendConfigured?: boolean }) => { setHistory(data.items || []); setHistoryTotal(data.totalItems || 0); setLogsConfigured(data.configured !== false); setResendConfigured(data.resendConfigured !== false) })
      .catch(() => setLogsConfigured(false))
  }, [historyPage, historyStatus, historyTemplate])

  useEffect(() => {
    fetch('/api/admin/email-templates', { credentials: 'include', cache: 'no-store' }).then((response) => response.ok ? response.json() : null).then((data: Record<string, TemplateOverride> | null) => { if (data) setTemplateOverrides(data) }).catch(() => toast.error('Não foi possível carregar os templates salvos.'))
  }, [])

  useEffect(() => { setRecipientPage(1) }, [search])

  useEffect(() => { setHistoryPage(1) }, [historyStatus, historyTemplate])

  useEffect(() => {
    if (!profileId) { setPreview(null); return }
    setPreviewLoading(true)
    fetch(`/api/admin/profiles/${encodeURIComponent(profileId)}/reminder?template=${encodeURIComponent(template)}`, { credentials: 'include', cache: 'no-store' })
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
    if (!preview) return
    setConfirmOpen(true)
  }

  const confirmSendEmail = async () => {
    if (!preview) return
    setConfirmOpen(false)
    setSending(true)
    try {
      const response = await fetch(`/api/admin/profiles/${encodeURIComponent(profileId)}/reminder?template=${encodeURIComponent(template)}`, { method: 'POST', credentials: 'include' })
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string }
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar o email.')
      toast.success(data.message || 'Email enviado individualmente.')
      const [updatedPreview, updatedHistory] = await Promise.all([
        fetch(`/api/admin/profiles/${encodeURIComponent(profileId)}/reminder?template=${encodeURIComponent(template)}`, { credentials: 'include', cache: 'no-store' }).then((response) => response.ok ? response.json() : null),
        fetch('/api/admin/emails?page=1&perPage=10', { credentials: 'include', cache: 'no-store' }).then((response) => response.json()),
      ])
      if (updatedPreview) setPreview(updatedPreview)
      setHistory(updatedHistory.items || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar o email.')
    } finally { setSending(false) }
  }

  const saveTemplate = async () => {
    setSavingTemplate(true)
    try {
      const response = await fetch('/api/admin/email-templates', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(templateOverrides) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar o template.')
      setTemplateOverrides(data); setEditingTemplate(false); toast.success('Template salvo.')
      if (profileId) { const refreshed = await fetch(`/api/admin/profiles/${encodeURIComponent(profileId)}/reminder?template=${encodeURIComponent(template)}`, { credentials: 'include', cache: 'no-store' }); if (refreshed.ok) setPreview(await refreshed.json()) }
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o template.') } finally { setSavingTemplate(false) }
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
      {TEMPLATES.map((item) => <button key={item.id} type="button" aria-pressed={template === item.id} onClick={() => { setTemplate(item.id); setProfileId(''); setEditingTemplate(false) }} className={`w-full rounded-lg border p-3 text-left focus:outline-none focus:ring-2 focus:ring-primary-400 ${template === item.id ? 'border-primary-400 bg-primary-500/10' : 'border-slate-700 hover:bg-slate-800'}`}><span className="text-sm font-semibold text-white">{item.label}</span><span className="mt-1 block text-xs text-slate-400">{item.description}</span><span className="mt-2 block text-xs text-slate-500">Público: {item.audience} · intervalo: {item.cooldownDays} dias</span></button>)}
        </aside>

        <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
          <div className="mb-5 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary-400" /><h2 className="text-lg font-semibold text-white">Revisar e enviar</h2></div><button type="button" onClick={() => setEditingTemplate((value) => !value)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700">{editingTemplate ? 'Fechar editor' : 'Editar template'}</button></div>
          {editingTemplate && <div className="mb-5 rounded-lg border border-primary-400/40 bg-primary-500/5 p-4"><p className="mb-3 text-xs text-slate-400">Variáveis permitidas: <code>{'{{nome}}'}</code>, <code>{'{{link}}'}</code> e <code>{'{{data_vencimento}}'}</code>. O corpo aceita texto simples.</p><label className="block text-xs text-slate-300">Assunto<input value={templateOverrides[template]?.subject || ''} onChange={(event) => setTemplateOverrides((all) => ({ ...all, [template]: { subject: event.target.value, body: all[template]?.body || '' } }))} className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white" maxLength={180} /></label><label className="mt-3 block text-xs text-slate-300">Corpo<textarea value={templateOverrides[template]?.body || ''} onChange={(event) => setTemplateOverrides((all) => ({ ...all, [template]: { subject: all[template]?.subject || '', body: event.target.value } }))} className="mt-1 min-h-32 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white" maxLength={5000} /></label><button type="button" onClick={saveTemplate} disabled={savingTemplate} className="mt-3 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{savingTemplate ? 'Salvando...' : 'Salvar template'}</button></div>}
          <div className="mb-4 flex flex-wrap gap-2 text-xs"><span className={`rounded-full px-2 py-1 ${resendConfigured ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>Resend: {resendConfigured ? 'configurado' : 'não configurado'}</span><span className={`rounded-full px-2 py-1 ${logsConfigured ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>Histórico: {logsConfigured ? 'ativo' : 'indisponível'}</span></div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="recipient">Destinatária</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar nome, email ou cidade" className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" aria-label="Pesquisar destinatária" />
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary-400" /> : <select id="recipient" value={profileId} onChange={(event) => setProfileId(event.target.value)} className="mb-5 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-white"><option value="">Selecione uma anunciante</option>{recipients.map((profile) => <option key={profile.id} value={profile.id}>{profile.name || 'Sem nome'} — {profile.owner_email || 'sem email'} — {profile.city || 'sem cidade'}{profile.status ? ` — ${profile.status}` : ''}</option>)}</select>}
          {previewLoading && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Gerando prévia...</div>}
          {preview && !previewLoading && <>
            <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm"><p className="text-slate-400">Template: <span className="text-white">{TEMPLATES.find((item) => item.id === template)?.label || template}</span></p><p className="mt-1 text-slate-400">De: <span className="text-white">{preview.from || 'remetente configurado'}</span></p><p className="mt-1 text-slate-400">Para: <span className="text-white">{preview.recipient}</span></p><p className="mt-1 text-slate-400">Assunto: <span className="text-white">{preview.subject}</span></p>{preview.lastSentAt && <p className="mt-1 text-amber-300">Último envio: {new Date(preview.lastSentAt).toLocaleString('pt-BR')} {preview.cooldown?.allowed ? '(pode reenviar)' : `(aguarde ${preview.cooldown?.remainingHours}h)`}</p>}</div>
            <div className="overflow-hidden rounded-lg border border-slate-600 bg-white"><iframe title="Prévia do email" srcDoc={preview.html} sandbox="" className="h-[620px] w-full" /></div>
            <details className="mt-4 rounded-lg border border-slate-700 p-3"><summary className="cursor-pointer text-sm text-slate-300">Ver versão de texto</summary><pre className="mt-3 whitespace-pre-wrap text-xs text-slate-400">{preview.text}</pre></details>
            <button type="button" onClick={sendEmail} disabled={sending || preview.cooldown?.allowed === false} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"><Send className="h-4 w-4" />{sending ? 'Enviando...' : preview.cooldown?.allowed === false ? 'Aguardar para reenviar' : 'Confirmar envio individual'}</button>
          </>}
          {!preview && !previewLoading && <p className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">Selecione uma destinatária para visualizar o email antes do envio.</p>}
          {recipientTotal > 20 && <div className="mt-4 flex items-center justify-between text-sm text-slate-400"><button type="button" disabled={recipientPage <= 1} onClick={() => setRecipientPage((page) => page - 1)} className="rounded border border-slate-600 px-3 py-2 disabled:opacity-40">Anterior</button><span>Página {recipientPage} de {Math.max(1, Math.ceil(recipientTotal / 20))}</span><button type="button" disabled={recipientPage >= Math.ceil(recipientTotal / 20)} onClick={() => setRecipientPage((page) => page + 1)} className="rounded border border-slate-600 px-3 py-2 disabled:opacity-40">Próxima</button></div>}
        </section>
      </div>
      <section className="mt-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-white">Histórico de envios</h2><div className="flex gap-2"><select aria-label="Filtrar histórico por template" value={historyTemplate} onChange={(event) => setHistoryTemplate(event.target.value)} className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white"><option value="">Todos os templates</option>{TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><select aria-label="Filtrar histórico por status" value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)} className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white"><option value="">Todos os status</option><option value="sent">Enviados</option><option value="failed">Falhos</option></select></div></div>{!logsConfigured && <p className="mb-3 text-xs text-amber-300">Histórico ainda não configurado</p>}{history.length === 0 ? <p className="text-sm text-slate-500">Nenhum envio registrado.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-700 text-slate-400"><th className="p-2">Data</th><th className="p-2">Template</th><th className="p-2">Destinatária</th><th className="p-2">Admin</th><th className="p-2">Status</th></tr></thead><tbody>{history.map((item) => <tr key={item.id} className="border-b border-slate-800"><td className="p-2 text-slate-400">{item.created ? new Date(item.created).toLocaleString('pt-BR') : '-'}</td><td className="p-2 text-slate-300">{item.template || '-'}</td><td className="p-2 text-slate-300">{item.recipient_email || '-'}</td><td className="p-2 text-slate-400">{item.expand?.sender_admin?.email || '-'}</td><td className={`p-2 ${item.status === 'sent' ? 'text-emerald-300' : 'text-red-300'}`}>{item.status === 'sent' ? 'Enviado' : item.status === 'failed' ? 'Falhou' : item.status || '-'}</td></tr>)}</tbody></table></div>}{historyTotal > 10 && <div className="mt-4 flex items-center justify-between text-sm text-slate-400"><button type="button" disabled={historyPage <= 1} onClick={() => setHistoryPage((page) => page - 1)} className="rounded border border-slate-600 px-3 py-2 disabled:opacity-40">Anterior</button><span>Página {historyPage} de {Math.ceil(historyTotal / 10)}</span><button type="button" disabled={historyPage >= Math.ceil(historyTotal / 10)} onClick={() => setHistoryPage((page) => page + 1)} className="rounded border border-slate-600 px-3 py-2 disabled:opacity-40">Próxima</button></div>}</section>
      {confirmOpen && preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-email-title"><div className="w-full max-w-lg rounded-xl border border-slate-600 bg-slate-900 p-6 shadow-2xl"><h2 id="confirm-email-title" className="text-lg font-semibold text-white">Confirmar envio individual</h2><p className="mt-3 text-sm leading-6 text-slate-300">Você está prestes a enviar o template <strong>{TEMPLATES.find((item) => item.id === template)?.label}</strong> para <strong>{preview.recipient}</strong>.</p><p className="mt-2 text-sm text-amber-300">Esse envio será registrado no histórico e não poderá ser desfeito.</p><div className="mt-6 flex justify-end gap-3"><button ref={cancelButtonRef} type="button" onClick={() => setConfirmOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300">Cancelar</button><button type="button" onClick={confirmSendEmail} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">Confirmar e enviar</button></div></div></div>}
    </div>
  )
}
