'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Copy, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore, isAdminRole } from '@/store/auth'
import { formatCpfOrCnpj, isValidCpfOrCnpj } from '@/lib/brazil-document'

interface PlanPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  planId?: string
  billingPeriod: 'weekly' | 'monthly'
  planName: string
  amount: number
  profileId?: string
  customerName?: string
  customerEmail?: string
  onSuccess: (paymentId: string) => void
}

function formatPrice(val: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val)
}

export default function PlanPaymentModal({
  isOpen,
  onClose,
  planId,
  billingPeriod,
  planName,
  amount,
  profileId,
  customerName,
  customerEmail,
  onSuccess,
}: PlanPaymentModalProps) {
  const [step, setStep] = useState<'init' | 'pix' | 'simulate'>('init')
  const [loading, setLoading] = useState(false)
  const [pixError, setPixError] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [copyPaste, setCopyPaste] = useState<string | null>(null)
  const [linkPagamento, setLinkPagamento] = useState<string | null>(null)
  const [externalRef, setExternalRef] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const [receiverCpf, setReceiverCpf] = useState('')
  const [receiverCpfError, setReceiverCpfError] = useState<string | null>(null)
  const idempotencyKey = useRef<string | null>(null)
  const userRole = useAuthStore((s) => s.user?.role)
  const showSimulate = isAdminRole(userRole)

  const createPix = useCallback(async () => {
    setLoading(true)
    setPixError(null)
    setReceiverCpfError(null)
    if (!isValidCpfOrCnpj(receiverCpf)) {
      setReceiverCpfError('Informe um CPF ou CNPJ válido.')
      setLoading(false)
      return
    }
    try {
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID()
      const res = await fetch('/api/payments/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current },
        credentials: 'include',
        body: JSON.stringify({
          planId,
          billingPeriod,
          profileId,
          description: `CerejaVIP - ${planName}`,
          customerName,
          customerEmail,
          receiverCpf,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Erro ao gerar PIX')
      }
      const d = data as { qr_code_base64?: string; qr_image_url?: string; pix_copia_cola?: string; link_pagamento?: string; payment_id?: string; external_reference?: string }
      setQrCode(d.qr_code_base64 || d.qr_image_url || null)
      setCopyPaste(d.pix_copia_cola || null)
      setLinkPagamento(d.link_pagamento || d.qr_image_url || null)
      setExternalRef(d.payment_id || d.external_reference || null)
      setStep('pix')
      setPolling(true)
    } catch (err) {
      setPixError(err instanceof Error ? err.message : 'Erro ao gerar PIX')
    } finally {
      setLoading(false)
    }
  }, [
    planId,
    billingPeriod,
    profileId,
    planName,
    customerName,
    customerEmail,
    receiverCpf,
  ])

  useEffect(() => {
    if (isOpen) {
      setStep('init')
      setLoading(false)
      setPixError(null)
      setQrCode(null)
      setCopyPaste(null)
      setLinkPagamento(null)
      setExternalRef(null)
      setPolling(false)
      idempotencyKey.current = null
      setReceiverCpf('')
      setReceiverCpfError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !externalRef || !polling) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/pix/status?payment_id=${encodeURIComponent(externalRef)}`,
          { credentials: 'include' }
        )
        const data = (await res.json()) as { status?: string }
        const status = (data.status || 'pending').toLowerCase()
        if (status === 'completed') {
          setPolling(false)
          onSuccess(externalRef)
          onClose()
        } else if (
          status === 'cancelled' ||
          status === 'expired' ||
          status === 'refunded' ||
          status === 'erro'
        ) {
          setPolling(false)
        }
      } catch {
        // Ignora erro de polling
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [isOpen, externalRef, polling, onSuccess, onClose])

  const copyToClipboard = () => {
    if (!copyPaste) return
    navigator.clipboard.writeText(copyPaste).then(() => toast.success('Código copiado!'))
  }

  const handleSimulate = () => {
    onSuccess('SIMULATED_PAYMENT')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800/50 p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="text-green-500">◆</span> Pagamento via PIX
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="mb-1 text-sm text-slate-400">Valor a pagar</p>
            <p className="text-3xl font-bold text-white">{formatPrice(amount)}</p>
            <p className="mt-1 text-sm text-primary-400">{planName}</p>
          </div>

          {step === 'init' && !loading && (
            <div className="mt-4 space-y-2">
              <label className="block text-xs text-slate-400">
                CPF ou CNPJ de quem fará o pagamento
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={receiverCpf}
                onChange={(e) => {
                  setReceiverCpf(formatCpfOrCnpj(e.target.value))
                  setReceiverCpfError(null)
                }}
                placeholder="000.000.000-00"
                maxLength={18}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none"
              />
              {receiverCpfError && <p className="text-xs text-red-400">{receiverCpfError}</p>}
              <p className="text-xs leading-relaxed text-amber-300">
                O QR Code só poderá ser pago pelo titular deste CPF/CNPJ. Pagamentos feitos por
                outra pessoa serão rejeitados pela PixGo.
              </p>
              <button
                type="button"
                onClick={createPix}
                className="mt-2 w-full rounded-lg bg-primary-600 py-3 font-medium text-white transition hover:bg-primary-500"
              >
                Gerar PIX
              </button>
            </div>
          )}

          {loading && (
            <div className="mt-6 flex flex-col items-center justify-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
              <p className="text-slate-400">Gerando PIX...</p>
            </div>
          )}

          {pixError && (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="text-red-300 text-sm">{pixError}</p>
              {showSimulate && (
                <button
                  type="button"
                  onClick={handleSimulate}
                  className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400"
                >
                  Simular Pagamento (DEV)
                </button>
              )}
            </div>
          )}

          {step === 'pix' && (qrCode || copyPaste) && !loading && (
            <div className="mt-6 space-y-4">
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code PIX" className="h-48 w-48 rounded-lg border border-slate-600" />
                </div>
              )}
              {copyPaste && (
                <div>
                  <label className="mb-1 block text-xs text-slate-500">PIX Copia e Cola</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={copyPaste}
                      className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="rounded-lg bg-slate-700 p-2 text-slate-300 transition hover:bg-slate-600"
                      aria-label="Copiar"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              {linkPagamento && (
                <a
                  href={linkPagamento}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-primary-500/50 bg-primary-500/20 py-2 text-center text-sm font-medium text-primary-400 transition hover:bg-primary-500/30"
                >
                  Abrir link de pagamento
                </a>
              )}
              {polling && (
                <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando pagamento...
                </p>
              )}
            </div>
          )}

          {showSimulate && (
            <div className="mt-6 border-t border-slate-700 pt-4">
              <button
                type="button"
                onClick={handleSimulate}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 py-2 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-slate-300"
              >
                Simular pagamento (desenvolvimento)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
