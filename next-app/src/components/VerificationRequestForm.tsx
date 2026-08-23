'use client'

import { useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface VerificationRequestFormProps {
  profile: Profile
  onSuccess?: () => void
}

export default function VerificationRequestForm({ profile, onSuccess }: VerificationRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [docFront, setDocFront] = useState<File | null>(null)
  const [docBack, setDocBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [fullName, setFullName] = useState(profile.name || '')
  const [documentType, setDocumentType] = useState('rg')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docFront || !docBack || !selfie) {
      setError('Envie documento (frente e verso) e selfie')
      return
    }
    if (!fullName.trim()) {
      setError('Informe seu nome completo conforme o documento')
      return
    }
    if (!termsAccepted) {
      setError('Aceite os termos para enviar a solicitação')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('profileId', profile.id)
      fd.append('full_name', fullName.trim())
      fd.append('document_type', documentType)
      fd.append('terms_accepted', 'true')
      fd.append('document_front', docFront)
      fd.append('document_back', docBack)
      fd.append('selfie', selfie)
      const res = await fetch('/api/verification', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const d = data as { error?: string; detail?: string }
        throw new Error(d.detail ? `${d.error || 'Erro'}: ${d.detail}` : d.error || 'Erro ao enviar')
      }
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setLoading(false)
    }
  }

  if (profile.verified) {
    return (
      <div className="advertiser-verification-status flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <span>Perfil verificado</span>
      </div>
    )
  }

  if (success) {
    return (
      <div className="rounded-lg border border-primary-500/30 bg-primary-500/10 p-4 text-center text-primary-300">
        <p>Solicitação enviada! Aguarde a análise.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h3 className="mb-4 flex items-center gap-2 font-medium text-white">
        <ShieldCheck className="h-5 w-5 text-primary-400" />
        Solicitar verificação
      </h3>
      <p className="mb-4 text-sm text-slate-400">
        Envie documento de identidade (frente e verso) e uma selfie segurando o documento para verificar seu perfil.
      </p>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">{error}</div>
      )}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-400" htmlFor="verification-full-name">Nome completo conforme o documento</label>
          <input id="verification-full-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500" />
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1" />
          <span>Confirmo que os dados enviados são verdadeiros e aceito os termos da solicitação de verificação.</span>
        </label>
        <div>
          <label className="mb-1 block text-sm text-slate-400" htmlFor="verification-document-type">Tipo de documento</label>
          <select id="verification-document-type" value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
            <option value="rg">RG</option>
            <option value="cnh">CNH</option>
            <option value="passport">Passaporte</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Documento - Frente</label>
          <input
            type="file"
            accept="image/*,.pdf"
            required
            onChange={(e) => setDocFront(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Documento - Verso</label>
          <input
            type="file"
            accept="image/*,.pdf"
            required
            onChange={(e) => setDocBack(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Selfie com documento</label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setSelfie(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:text-white"
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Imagens de até 15 MB são convertidas e otimizadas para WebP; PDFs devem ter até 5 MB. Os documentos ficam disponíveis apenas para análise da equipe.</p>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 font-medium text-white transition hover:bg-primary-500 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Enviar solicitação
          </>
        )}
      </button>
    </form>
  )
}
