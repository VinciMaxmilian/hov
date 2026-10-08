/**
 * Nome do protagonista (D-3, LORE_BIBLE §2.1): só aparece no final, substituindo "{heir}" nos textos de
 * encerramento. Nunca entra em conteúdo, dicionários ou interface antes disso (ver i18n.test.ts).
 */
export const HEIR_NAME = 'Worren'

export const withHeir = (text: string) => text.split('{heir}').join(HEIR_NAME)
