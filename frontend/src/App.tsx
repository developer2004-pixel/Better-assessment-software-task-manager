import React, { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react'
import './App.css'

// Minimal Task type to match backend
interface Task {
  id: number
  title: string
  completed: boolean
}

type TaskFilter = 'all' | 'active' | 'completed'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const apiBase = useMemo(() => {
    // Default to relative /api so Vite's dev proxy forwards to the Flask backend.
    // Can be overridden (e.g. for production) via VITE_API_BASE_URL.
    return import.meta.env.VITE_API_BASE_URL ?? '/api'
  }, [])

  async function fetchTasks() {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${apiBase}/tasks`)
      if (!resp.ok) throw new Error(`Failed to load tasks (${resp.status})`)
      const data: Task[] = await resp.json()
      // Keep tasks sorted by id for a stable, predictable list
      setTasks(data.sort((a, b) => a.id - b.id))
    } catch (e: any) {
      setError(e.message ?? 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addTask(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setError(null)
    try {
      const resp = await fetch(`${apiBase}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!resp.ok) throw new Error(`Create failed (${resp.status})`)
      const task: Task = await resp.json()
      setTasks((prev) => [...prev, task])
      setTitle('')
    } catch (e: any) {
      setError(e.message ?? 'Failed to create task')
    }
  }

  function startEditing(task: Task) {
    setEditingId(task.id)
    setEditingTitle(task.title)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingTitle('')
  }

  async function saveEditing(task: Task) {
    const trimmed = editingTitle.trim()
    if (!trimmed || trimmed === task.title) {
      cancelEditing()
      return
    }
    setError(null)
    try {
      const resp = await fetch(`${apiBase}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!resp.ok) throw new Error(`Update failed (${resp.status})`)
      const updated: Task = await resp.json()
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      cancelEditing()
    } catch (e: any) {
      setError(e.message ?? 'Failed to update task')
    }
  }

  async function toggleCompleted(task: Task) {
    setError(null)
    try {
      const resp = await fetch(`${apiBase}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      if (!resp.ok) throw new Error(`Update failed (${resp.status})`)
      const updated: Task = await resp.json()
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (e: any) {
      setError(e.message ?? 'Failed to update task')
    }
  }

  async function deleteTask(id: number) {
    setError(null)
    try {
      const resp = await fetch(`${apiBase}/tasks/${id}`, { method: 'DELETE' })
      if (!resp.ok && resp.status !== 204) throw new Error(`Delete failed (${resp.status})`)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete task')
    }
  }

  function clearCompleted() {
    const completedIds = tasks.filter((t) => t.completed).map((t) => t.id)
    if (!completedIds.length) return
    // Fire-and-forget; UI will refresh optimistically
    completedIds.forEach((id) => {
      deleteTask(id)
    })
  }

  const total = tasks.length
  const completedCount = tasks.filter((t) => t.completed).length

  const filteredTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((t) => !t.completed)
    if (filter === 'completed') return tasks.filter((t) => t.completed)
    return tasks
  }, [tasks, filter])

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Task Board</h1>
        <p className="subtitle">Simple CRUD app built with React, TypeScript, Vite, and Flask.</p>
      </header>

      <main className="container">
        <section className="composer">
          <form onSubmit={addTask} className="row">
            <input
              type="text"
              aria-label="Task title"
              placeholder="Add a new task"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>

          <div className="toolbar">
            <div className="filters" aria-label="Filter tasks">
              <button
                type="button"
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={filter === 'active' ? 'active' : ''}
                onClick={() => setFilter('active')}
              >
                Active
              </button>
              <button
                type="button"
                className={filter === 'completed' ? 'active' : ''}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>

            <div className="stats">
              <span>{completedCount} / {total} completed</span>
              <button type="button" onClick={clearCompleted} disabled={!completedCount}>
                Clear completed
              </button>
            </div>
          </div>
        </section>

        {loading && <p>Loading…</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {!loading && !filteredTasks.length && (
          <p className="empty">No tasks yet. Add your first task to get started.</p>
        )}

        <ul className="tasks">
          {filteredTasks.map((t) => {
            const isEditing = editingId === t.id

            const handleEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                saveEditing(t)
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                cancelEditing()
              }
            }

            return (
              <li key={t.id} className={t.completed ? 'done' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => toggleCompleted(t)}
                  />
                  {isEditing ? (
                    <input
                      className="edit-input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={handleEditKey}
                      onBlur={() => saveEditing(t)}
                      autoFocus
                    />
                  ) : (
                    <span>{t.title}</span>
                  )}
                </label>
                <div className="item-actions">
                  {isEditing ? (
                    <button type="button" onClick={() => saveEditing(t)}>
                      Save
                    </button>
                  ) : (
                    <button type="button" onClick={() => startEditing(t)}>
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="danger"
                    onClick={() => deleteTask(t.id)}
                    aria-label={`Delete ${t.title}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}

export default App
