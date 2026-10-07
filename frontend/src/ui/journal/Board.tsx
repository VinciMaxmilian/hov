import { useMemo } from 'react'
import { journalView } from '../../game/journal/journalSystem'
import { useGame } from '../../game/state/gameStore'
import { useTr } from '../../game/i18n'

/**
 * Quadro de investigação: nós e conexões descobertos. Inferências aparecem tracejadas com "?",
 * nós ainda não identificados aparecem só como "?". Layout vem do conteúdo (x, y).
 */
export function Board() {
  const state = useGame()
  const t = useTr()
  const { nodes, edges } = useMemo(() => journalView(state), [state])
  const byId = new Map(nodes.map((n) => [n.id, n]))
  if (nodes.length === 0) return <p className="muted">{t('Nothing pinned to the board yet.')}</p>
  return (
    <svg className="board" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="cork" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#0c0f13" />
          <circle cx="2" cy="3" r="0.6" fill="#141a20" />
        </pattern>
      </defs>
      <rect width="1000" height="620" fill="url(#cork)" />
      {edges.map((e) => {
        const a = byId.get(e.from)!
        const b = byId.get(e.to)!
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        return (
          <g key={`${e.from}-${e.to}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={e.confirmed ? '#b08d57' : '#6d6658'}
              strokeWidth={e.confirmed ? 1.6 : 1.2}
              strokeDasharray={e.confirmed ? undefined : '6 6'}
            />
            {(e.label || !e.confirmed) && (
              <text x={mx} y={my - 6} textAnchor="middle" style={{ fontSize: 12, fill: '#a69c88', fontStyle: 'italic' }}>
                {e.confirmed ? t(e.label) : `? ${t(e.label)}`}
              </text>
            )}
          </g>
        )
      })}
      {nodes.map((n) => {
        const label = n.revealed ? t(n.label) : '?'
        const w = Math.max(60, label.length * 8.6 + 28)
        return (
          <g key={n.id} className={n.revealed ? '' : 'unknown'} transform={`translate(${n.x}, ${n.y})`}>
            <rect x={-w / 2} y={-17} width={w} height={34} fill={n.revealed ? '#d9c9a3' : '#1b2026'} stroke="#3a3328" transform="rotate(-1.5)" />
            <circle cx={0} cy={-17} r={4} fill="#8a2a1e" />
            <text textAnchor="middle" y={5} style={{ fill: n.revealed ? '#2a2116' : '#6d6658' }}>
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
