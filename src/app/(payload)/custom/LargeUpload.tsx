'use client'

import { upload } from '@vercel/blob/client'
import { useRef, useState } from 'react'
import Link from 'next/link'

type Status = 'idle' | 'uploading' | 'registering' | 'done' | 'error'

const ACCEPTED = '.pdf,image/*'
const MAX_MB   = 100

export default function LargeUpload() {
  const inputRef                    = useRef<HTMLInputElement>(null)
  const [status, setStatus]         = useState<Status>('idle')
  const [progress, setProgress]     = useState(0)
  const [result, setResult]         = useState<{ id: string; url: string } | null>(null)
  const [error, setError]           = useState('')
  const [selectedFile, setSelected] = useState<File | null>(null)

  const handleFileChange = () => {
    setSelected(inputRef.current?.files?.[0] ?? null)
    setStatus('idle')
    setError('')
    setResult(null)
  }

  const handleUploadClick = async () => {
    const file = inputRef.current?.files?.[0]
    if (!file) return

    try {
      setStatus('uploading')
      setProgress(0)
      setError('')

      // 1. Upload direto do browser → Vercel Blob (sem limite de 4,5 MB)
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/blob-upload',
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      })

      // 2. Registrar no banco via Payload
      setStatus('registering')
      const res = await fetch('/api/register-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          url:      blob.url,
          filename: file.name,
          mimeType: file.type || 'application/pdf',
          filesize: file.size,
        }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg ?? 'Erro ao registrar mídia')
      }

      setResult(await res.json())
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  const reset = () => {
    setStatus('idle')
    setProgress(0)
    setResult(null)
    setError('')
    setSelected(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 580, margin: '0 auto', fontFamily: 'Nunito, sans-serif' }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/collections/products" style={{
          fontSize: 13, color: '#FF6B9D', textDecoration: 'none', fontWeight: 600,
        }}>
          ← Voltar às Atividades
        </Link>
        <h1 style={{ margin: '12px 0 4px', fontSize: 22, fontWeight: 800, color: '#222' }}>
          Upload de Arquivo Grande
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#777' }}>
          Imagens ou PDFs até {MAX_MB} MB — sem limite de tamanho da Vercel.
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff',
        border: '1.5px solid #FFE0EC',
        borderRadius: 14,
        padding: '28px 24px',
        boxShadow: '0 2px 16px rgba(255,107,157,0.07)',
      }}>

        {status === 'done' && result ? (
          <Done result={result} onReset={reset} />
        ) : (
          <>
            {/* Seletor de arquivo */}
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '32px 16px',
              border: '2px dashed #FFBAD5',
              borderRadius: 10,
              cursor: 'pointer',
              background: selectedFile ? '#FFF0F5' : '#FAFAFA',
              transition: 'background 0.2s',
            }}>
              <span style={{ fontSize: 32 }}>{selectedFile ? '📄' : '☁️'}</span>
              <span style={{ fontSize: 13, color: '#555', textAlign: 'center' }}>
                {selectedFile
                  ? <><strong>{selectedFile.name}</strong><br />{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</>
                  : <>Clique para selecionar PDF ou imagem<br /><span style={{ color: '#aaa' }}>até {MAX_MB} MB</span></>
                }
              </span>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>

            {/* Progresso */}
            {(status === 'uploading' || status === 'registering') && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                  <span>{status === 'registering' ? 'Registrando no sistema…' : `Enviando… ${progress}%`}</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height: 8, background: '#FFE0EC', borderRadius: 99 }}>
                  <div style={{
                    height: '100%',
                    width: `${status === 'registering' ? 100 : progress}%`,
                    background: 'linear-gradient(90deg, #FF6B9D, #845EC2)',
                    borderRadius: 99,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            )}

            {/* Erro */}
            {status === 'error' && (
              <div style={{
                marginTop: 16, padding: '10px 14px', borderRadius: 8,
                background: '#FFF0F0', border: '1px solid #FFD0D0', fontSize: 13, color: '#C00',
              }}>
                ❌ {error}
              </div>
            )}

            {/* Botão */}
            <button
              onClick={handleUploadClick}
              disabled={!selectedFile || status === 'uploading' || status === 'registering'}
              style={{
                marginTop: 20,
                width: '100%',
                padding: '12px 0',
                borderRadius: 10,
                border: 'none',
                background: selectedFile && status === 'idle' || status === 'error'
                  ? 'linear-gradient(135deg, #FF6B9D, #845EC2)'
                  : '#DDD',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                cursor: selectedFile && (status === 'idle' || status === 'error') ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.2s',
              }}
            >
              {status === 'uploading' ? `Enviando… ${progress}%`
                : status === 'registering' ? 'Registrando…'
                : 'Fazer Upload'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Done({ result, onReset }: { result: { id: string; url: string }; onReset: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#222' }}>Upload concluído!</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#777' }}>
        A mídia foi salva. Use o ID abaixo para vinculá-la a uma atividade.
      </p>
      <div style={{
        padding: '10px 14px', borderRadius: 8,
        background: '#F0FFF4', border: '1px solid #BBF0CC',
        fontSize: 13, color: '#1A7A3A', marginBottom: 20, wordBreak: 'break-all',
      }}>
        <strong>ID da Mídia:</strong> {result.id}<br />
        <strong>URL:</strong> <a href={result.url} target="_blank" rel="noreferrer" style={{ color: '#1A7A3A' }}>{result.url}</a>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Link href="/admin/collections/media" style={{
          padding: '9px 18px', borderRadius: 8, background: '#FF6B9D',
          color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
        }}>
          Ver na Galeria
        </Link>
        <button onClick={onReset} style={{
          padding: '9px 18px', borderRadius: 8, background: '#F5F5F5',
          border: '1px solid #DDD', color: '#444', fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>
          Enviar outro
        </button>
      </div>
    </div>
  )
}
