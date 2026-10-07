import { create } from 'zustand'
import contentPt from '../../content/i18n/pt.json'
import { uiPt } from './pt.ui'

/**
 * Localização por frase-fonte (estilo gettext): o texto em inglês do conteúdo/UI é a chave e o fallback.
 * - Conteúdo narrativo: `src/content/i18n/<lang>.json` (dados, editável sem tocar código).
 * - Interface: `game/i18n/<lang>.ui.ts`.
 * Os stores guardam o texto-fonte; a tradução acontece na renderização (trocar de idioma atualiza tudo na hora).
 * Cobertura verificada por teste (`i18n.test.ts`): texto novo sem tradução quebra o build de testes.
 */
export type Lang = 'en' | 'pt'

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'pt', label: 'Português' },
]

const dictionaries: Record<Lang, Record<string, string>> = {
  en: {},
  pt: { ...(contentPt as Record<string, string>), ...uiPt },
}

const KEY = 'hov:lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'pt') return saved
  } catch {
    /* storage bloqueado */
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt')) return 'pt'
  return 'en'
}

interface LangStore {
  lang: Lang
  setLang(lang: Lang): void
}

export const useLang = create<LangStore>()((set) => ({
  lang: initialLang(),
  setLang: (lang) => {
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* só em memória */
    }
    set({ lang })
  },
}))

/** Marca um texto-fonte para tradução sem traduzir agora (é traduzido na renderização). O teste de cobertura enxerga msgid('...'). */
export const msgid = (source: string): string => source

const warned = new Set<string>()

/** Traduz um texto-fonte; `vars` substitui {nome}. Sem tradução → devolve o original. */
export function tr(source: string | undefined, vars?: Record<string, string | number>, lang: Lang = useLang.getState().lang): string {
  if (!source) return ''
  let out = dictionaries[lang][source]
  if (out === undefined) {
    if (lang !== 'en' && import.meta.env?.DEV && !warned.has(source)) {
      warned.add(source)
      console.warn(`[i18n] sem tradução (${lang}): ${JSON.stringify(source)}`)
    }
    out = source
  }
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v))
  return out
}

/** Hook: re-renderiza o componente quando o idioma muda. */
export function useTr(): (source: string | undefined, vars?: Record<string, string | number>) => string {
  const lang = useLang((s) => s.lang)
  return (source, vars) => tr(source, vars, lang)
}

/** Mantém <html lang> em dia (leitores de tela, hifenização). */
export function installLangAttribute(): void {
  const apply = (lang: Lang) => document.documentElement.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en')
  apply(useLang.getState().lang)
  useLang.subscribe((s) => apply(s.lang))
}

export const dictionaryFor = (lang: Lang) => dictionaries[lang]
