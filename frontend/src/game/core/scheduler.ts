/**
 * Timers de gameplay (ações "delay", legendas). Pausam junto com o jogo e são cancelados
 * ao carregar outro save, para nenhum evento de um save "vazar" para outro.
 */
interface Task {
  remaining: number
  fn: () => void
}

const tasks = new Set<Task>()

export const scheduler = {
  after(ms: number, fn: () => void): () => void {
    const task: Task = { remaining: ms, fn }
    tasks.add(task)
    return () => tasks.delete(task)
  },
  /** Chamado pelo loop de jogo apenas enquanto não está pausado. */
  tick(dtMs: number) {
    for (const task of [...tasks]) {
      task.remaining -= dtMs
      if (task.remaining <= 0) {
        tasks.delete(task)
        try {
          task.fn()
        } catch (err) {
          console.error('[scheduler] tarefa falhou', err)
        }
      }
    }
  },
  clear() {
    tasks.clear()
  },
}
