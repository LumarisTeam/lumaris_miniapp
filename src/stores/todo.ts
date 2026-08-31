import { create } from 'zustand'
import type { TodoItem } from '@/types/domain'
import { initializeStorage, readStorage, STORAGE_KEYS, writeStorage } from '@/utils/storage'

initializeStorage()

interface TodoState {
  todos: TodoItem[]
  add: (title: string, deadline: string) => void
  update: (todo: TodoItem) => void
  toggle: (id: string) => void
  remove: (id: string) => void
}

function save(todos: TodoItem[]): void {
  writeStorage(STORAGE_KEYS.TODOS, todos)
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: readStorage<TodoItem[]>(STORAGE_KEYS.TODOS, []),
  add: (title, deadline) => {
    const todos = [...get().todos, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: title.trim(), deadline, isCompleted: false }]
    save(todos)
    set({ todos })
  },
  update: (todo) => {
    const todos = get().todos.map((item) => (item.id === todo.id ? todo : item))
    save(todos)
    set({ todos })
  },
  toggle: (id) => {
    const todos = get().todos.map((todo) => (todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo))
    save(todos)
    set({ todos })
  },
  remove: (id) => {
    const todos = get().todos.filter((todo) => todo.id !== id)
    save(todos)
    set({ todos })
  },
}))
