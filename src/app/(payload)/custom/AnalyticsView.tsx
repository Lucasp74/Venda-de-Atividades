'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

// ── Tipos ─────────────────────────────────────────────────────
interface DayData {
  date:    string
  count:   number
  revenue: number
}

interface ProductData {
  name:    string
  count:   number
  revenue: number
}

interface AnalyticsData {
  dailySales:    DayData[]
  topProducts:   ProductData[]
  totalOrders:   number
  totalRevenue:  number
  productNames:  string[]
  from:          string
  to:            string
}

// ── Helpers ───────────────────────────────────────────────────
function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDateLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
}

// ── Tooltip customizado ───────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #FFE0EC',
      borderRadius: 12, padding: '10px 16px',
      boxShadow: '0 4px 20px rgba(255,107,157,0.15)',
      fontFamily: 'Nunito, sans-serif',
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: '#2D2D2D' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: '2px 0', fontSize: 13, color: '#555' }}>
          {p.name === 'count'
            ? `Vendas: ${p.value}`
            : `Receita: ${formatBRL(p.value)}`}
        </p>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function AnalyticsView() {
  const [from,      setFrom     ] = useState(daysAgoISO(29))
  const [to,        setTo       ] = useState(todayISO())
  const [product,   setProduct  ] = useState('')
  const [data,      setData     ] = useState<AnalyticsData | null>(null)
  const [loading,   setLoading  ] = useState(false)
  const [error,     setError    ] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'count' | 'revenue'>('count')

  const fetchData = useCallback(async (f: string, t: string, p: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ from: f, to: t })
      if (p) params.set('product', p)
      const res = await fetch(`/api/admin/analytics?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar dados')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(from, to, product) }, [])

  const handleFilter = () => fetchData(from, to, product)

  const setPreset = (days: number) => {
    const f = daysAgoISO(days - 1)
    const t = todayISO()
    setFrom(f)
    setTo(t)
    fetchData(f, t, product)
  }

  const handleProductChange = (value: string) => {
    setProduct(value)
    fetchData(from, to, value)
  }

  const clearProductFilter = () => {
    setProduct('')
    fetchData(from, to, '')
  }

  // ── Estilos inline (evita conflitos com CSS do Payload) ───
  const s = {
    page:    { padding: '32px 28px', fontFamily: 'Nunito, sans-serif', color: '#2D2D2D', maxWidth: 1100 } as React.CSSProperties,
    heading: { fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, marginBottom: 4 } as React.CSSProperties,
    sub:     { color: '#999', fontSize: 13, marginBottom: 28 } as React.CSSProperties,
    card:    { background: '#fff', borderRadius: 16, border: '1px solid #FFE0EC', padding: '20px 24px', marginBottom: 24 } as React.CSSProperties,
    row:     { display: 'flex', flexWrap: 'wrap' as const, gap: 12, alignItems: 'flex-end', marginBottom: 16 } as React.CSSProperties,
    label:   { fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 4, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.05em' } as React.CSSProperties,
    input:   { padding: '8px 12px', border: '2px solid #FFE0EC', borderRadius: 8, fontSize: 13, color: '#2D2D2D', background: '#fff', outline: 'none', fontFamily: 'Nunito, sans-serif' } as React.CSSProperties,
    select:  { padding: '8px 12px', border: '2px solid #FFE0EC', borderRadius: 8, fontSize: 13, color: '#2D2D2D', outline: 'none', fontFamily: 'Nunito, sans-serif', background: '#fff', minWidth: 180, cursor: 'pointer' } as React.CSSProperties,
    btnPrimary: { background: 'linear-gradient(135deg,#FF6B9D,#845EC2)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' } as React.CSSProperties,
    btnPreset:  { background: '#FFF0F5', color: '#E0527F', border: '1px solid #FFE0EC', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' } as React.CSSProperties,
    btnClear:   { background: 'transparent', color: '#AAA', border: '1px solid #EEE', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' } as React.CSSProperties,
    statCard: { background: 'linear-gradient(135deg,#FFF0F5,#fff)', border: '2px solid #FFE0EC', borderRadius: 14, padding: '18px 24px', flex: '1 1 160px', minWidth: 140 } as React.CSSProperties,
    statNum:  { fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 28, color: '#FF6B9D', lineHeight: 1 } as React.CSSProperties,
    statLbl:  { fontSize: 12, color: '#999', marginTop: 4, fontWeight: 700 } as React.CSSProperties,
    tabBtn:   (active: boolean) => ({ background: active ? 'linear-gradient(135deg,#FF6B9D,#845EC2)' : '#FFF0F5', color: active ? '#fff' : '#E0527F', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }) as React.CSSProperties,
    th:       { textAlign: 'left' as const, padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#AAA', textTransform: 'uppercase' as const, letterSpacing: '0.06em', borderBottom: '1px solid #FFE0EC' } as React.CSSProperties,
    td:       { padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #FFF0F5', color: '#333' } as React.CSSProperties,
    badge:    { background: '#FFF0F5', color: '#E0527F', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700, display: 'inline-block' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Relatórios de Vendas</h1>
      <p style={s.sub}>Analise o desempenho das vendas por período e produto</p>

      {/* ── Filtros ── */}
      <div style={s.card}>
        <div style={s.row}>
          <div>
            <span style={s.label}>De</span>
            <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} style={s.input} />
          </div>
          <div>
            <span style={s.label}>Até</span>
            <input type="date" value={to} min={from} max={todayISO()} onChange={e => setTo(e.target.value)} style={s.input} />
          </div>
          <div>
            <span style={s.label}>Produto</span>
            <select
              value={product}
              onChange={e => handleProductChange(e.target.value)}
              style={s.select}
            >
              <option value="">Todos os produtos</option>
              {(data?.productNames ?? []).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleFilter} style={{ ...s.btnPrimary, alignSelf: 'flex-end' }}>
            {loading ? 'Buscando...' : 'Filtrar'}
          </button>
        </div>

        {/* Atalhos + limpar filtro */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Hoje',    days: 1  },
            { label: '7 dias',  days: 7  },
            { label: '30 dias', days: 30 },
            { label: '90 dias', days: 90 },
          ].map(({ label, days }) => (
            <button key={days} onClick={() => setPreset(days)} style={s.btnPreset}>{label}</button>
          ))}

          {product && (
            <button onClick={clearProductFilter} style={s.btnClear}>
              ✕ Limpar filtro de produto
            </button>
          )}
        </div>

        {/* Indicador de filtro ativo */}
        {product && (
          <div style={{ marginTop: 12, padding: '8px 14px', background: '#F5F0FF', border: '1px solid #E0D4F5', borderRadius: 8, fontSize: 12, color: '#845EC2' }}>
            Filtrando por: <strong>{product}</strong>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 10, padding: '12px 16px', color: '#C00', marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          {/* ── Cards de totais ── */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={s.statCard}>
              <div style={s.statNum}>{data.totalOrders}</div>
              <div style={s.statLbl}>Vendas no período</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statNum}>{formatBRL(data.totalRevenue)}</div>
              <div style={s.statLbl}>Receita total</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statNum}>
                {data.totalOrders > 0 ? formatBRL(data.totalRevenue / data.totalOrders) : 'R$ 0'}
              </div>
              <div style={s.statLbl}>Ticket médio</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statNum}>{data.topProducts.length}</div>
              <div style={s.statLbl}>Produtos vendidos</div>
            </div>
          </div>

          {/* ── Gráfico ── */}
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, margin: 0 }}>
                Vendas diárias {product && <span style={{ fontSize: 12, color: '#845EC2', fontWeight: 600 }}>— {product}</span>}
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setActiveTab('count')}   style={s.tabBtn(activeTab === 'count')}>Quantidade</button>
                <button onClick={() => setActiveTab('revenue')} style={s.tabBtn(activeTab === 'revenue')}>Receita</button>
              </div>
            </div>

            {data.dailySales.every(d => d.count === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#BBB', fontSize: 14 }}>
                Nenhuma venda encontrada neste período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.dailySales} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFF0F5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tick={{ fontSize: 11, fill: '#AAA', fontFamily: 'Nunito, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#AAA', fontFamily: 'Nunito, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tickFormatter={activeTab === 'revenue' ? (v: number) => `R$${v}` : undefined}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FFF0F5' }} />
                  <Bar
                    dataKey={activeTab}
                    name={activeTab}
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#FF6B9D" />
                      <stop offset="100%" stopColor="#845EC2" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Tabela de produtos ── */}
          <div style={s.card}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>
              {product ? `Vendas de "${product}"` : 'Produtos mais vendidos no período'}
            </h2>

            {data.topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#BBB', fontSize: 14 }}>
                Nenhum produto vendido neste período
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, width: 36 }}>#</th>
                      <th style={s.th}>Produto</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Vendas</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Receita</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>% do total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr
                        key={p.name}
                        style={{ background: i % 2 === 0 ? '#fff' : '#FFFBFC', cursor: 'pointer' }}
                        onClick={() => handleProductChange(p.name)}
                        title={`Clique para filtrar por "${p.name}"`}
                      >
                        <td style={{ ...s.td, color: '#CCC', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ ...s.td, fontWeight: 600 }}>{p.name}</td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <span style={s.badge}>{p.count}</span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#FF6B9D' }}>
                          {formatBRL(p.revenue)}
                        </td>
                        <td style={{ ...s.td, textAlign: 'right', color: '#AAA' }}>
                          {data.totalOrders > 0
                            ? `${Math.round((p.count / data.totalOrders) * 100)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#CCC', fontSize: 14 }}>
          Carregando dados...
        </div>
      )}
    </div>
  )
}
