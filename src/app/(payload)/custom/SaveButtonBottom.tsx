'use client'

import { useFormFields, useForm } from '@payloadcms/ui'
import { useCallback } from 'react'

export default function SaveButtonBottom() {
  const { submit } = useForm()

  const handleSave = useCallback(() => {
    submit({})
  }, [submit])

  return (
    <div style={{
      marginTop: 32,
      paddingTop: 24,
      borderTop: '2px solid #FFE0EC',
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      <button
        type="button"
        onClick={handleSave}
        style={{
          background: 'linear-gradient(135deg, #FF6B9D 0%, #E0527F 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 10,
          padding: '12px 32px',
          fontSize: 15,
          fontWeight: 700,
          fontFamily: 'Nunito, sans-serif',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(255, 107, 157, 0.35)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(255,107,157,0.45)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(255,107,157,0.35)'
        }}
      >
        💾 Salvar Atividade
      </button>
    </div>
  )
}
