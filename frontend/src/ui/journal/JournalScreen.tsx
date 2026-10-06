import { useMemo, useState } from 'react'
import { resumePlay } from '../../game/controls'
import { content } from '../../game/content'
import { journalCategories, type GameDocument, type ItemCategory } from '../../game/content/schemas'
import { journalView } from '../../game/journal/journalSystem'
import { useGame } from '../../game/state/gameStore'
import { useUi } from '../../game/state/uiStore'
import { formatGameClock } from '../format'
import { Board } from './Board'

const DOC_CATEGORY: Record<GameDocument['kind'], ItemCategory> = {
  letter: 'DOCUMENTS',
  note: 'NOTES',
  card: 'NOTES',
  newspaper: 'DOCUMENTS',
  report: 'DOCUMENTS',
  record: 'DOCUMENTS',
  photograph: 'PHOTOGRAPHS',
  recording: 'RECORDINGS',
}

const CATEGORY_ORDER: ItemCategory[] = ['KEY_ITEMS', 'TOOLS', 'DOCUMENTS', 'PHOTOGRAPHS', 'NOTES', 'MAPS', 'RECORDINGS']

/** Tab: pertences (inventário + documentos), journal (entradas) e quadro de conexões. */
export function JournalScreen() {
  const tab = useUi((s) => s.journalTab)
  const clock = useGame((s) => s.clock)
  const setTab = (t: typeof tab) => useUi.setState({ journalTab: t })
  return (
    <div className="layer journal">
      <div className="journal-tabs">
        {(['belongings', 'journal', 'board'] as const).map((t) => (
          <button key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
        <span className="clock">{formatGameClock(clock.day, clock.minutes)}</span>
        <button className="btn small" onClick={resumePlay}>
          <span className="key">Tab</span> close
        </button>
      </div>
      {tab === 'belongings' && <Belongings />}
      {tab === 'journal' && <Entries />}
      {tab === 'board' && <Board />}
    </div>
  )
}

function Belongings() {
  const inventory = useGame((s) => s.inventory)
  const documents = useGame((s) => s.documents)
  const groups = useMemo(() => {
    const out = new Map<ItemCategory, { key: string; name: string; open: () => void }[]>()
    const push = (cat: ItemCategory, entry: { key: string; name: string; open: () => void }) => {
      if (!out.has(cat)) out.set(cat, [])
      out.get(cat)!.push(entry)
    }
    for (const id of inventory) {
      const item = content.items.get(id)
      if (item) push(item.category, { key: id, name: item.name, open: () => useUi.getState().openInspect({ kind: 'item', id }, 'journal') })
    }
    for (const id of documents) {
      const doc = content.documents.get(id)
      if (doc) push(DOC_CATEGORY[doc.kind], { key: id, name: doc.title, open: () => useUi.getState().openInspect({ kind: 'document', id }, 'journal') })
    }
    return CATEGORY_ORDER.filter((c) => out.has(c)).map((c) => ({ cat: c, entries: out.get(c)! }))
  }, [inventory, documents])

  if (groups.length === 0) return <p className="muted">Your pockets are empty. Rain-damp, but empty.</p>
  return (
    <div style={{ overflow: 'auto' }}>
      {groups.map((g) => (
        <section key={g.cat} style={{ marginBottom: '1.4rem' }}>
          <h4 className="small-caps" style={{ color: 'var(--brass)', fontWeight: 500, letterSpacing: '0.3em', fontSize: '0.8rem' }}>
            {g.cat.replace('_', ' ')}
          </h4>
          <div className="belongings">
            {g.entries.map((e) => (
              <button key={e.key} className="belonging" onClick={e.open}>
                <div className="name">{e.name}</div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Entries() {
  const state = useGame()
  const view = useMemo(() => journalView(state), [state])
  const [selected, setSelected] = useState<string | null>(null)
  const current = view.entries.find((e) => e.id === selected) ?? view.entries[view.entries.length - 1]
  return (
    <div className="journal-body">
      <nav className="journal-list">
        {journalCategories.map((cat) => {
          const items = view.entries.filter((e) => e.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat}>
              <h4>{cat}</h4>
              {items.map((e) => (
                <button key={e.id} className={`${current?.id === e.id ? 'on' : ''} ${e.resolved ? 'resolved' : ''}`} onClick={() => setSelected(e.id)}>
                  {e.category === 'UNRESOLVED' && !e.resolved ? '? ' : ''}
                  {e.title}
                </button>
              ))}
            </div>
          )
        })}
      </nav>
      <article className="journal-detail">
        {current ? (
          <>
            <div className="cat">{current.category}</div>
            <h2>{current.title}</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{current.text}</p>
            {current.resolved && <p className="resolved">You have a lead on this now.</p>}
          </>
        ) : (
          <p className="muted">Nothing written yet.</p>
        )}
      </article>
    </div>
  )
}
