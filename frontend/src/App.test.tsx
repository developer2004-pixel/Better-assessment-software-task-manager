import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Basic global fetch mock that we can control per test
const mockFetch = vi.fn()

beforeEach(() => {
  mockFetch.mockReset()
  // @ts-expect-error - assigning to global for tests
  global.fetch = mockFetch
})

describe('App task behaviors', () => {
  it('Task can be created with an initial completed status', async () => {
    // First call: initial load (empty list)
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    // Second call: create task; backend returns task already completed
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 1, title: 'Done task', completed: true }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    render(<App />)

    // Wait for initial fetch
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    const input = screen.getByLabelText('Task title') as HTMLInputElement
    const addButton = screen.getByRole('button', { name: /add/i })

    await userEvent.type(input, 'Done task')
    await userEvent.click(addButton)

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))

    // The created task should appear rendered as completed (li.done)
    const item = screen.getByText('Done task')
    expect(item.closest('li')).toHaveClass('done')
  })

  it('Task title can be updated successfully', async () => {
    // Initial load with one task
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ id: 1, title: 'Original', completed: false }]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    // PATCH response with updated title
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 1, title: 'Updated title', completed: false }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    render(<App />)

    // Wait for initial load
    await waitFor(() => screen.getByText('Original'))

    // Click Edit
    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)

    const editInput = screen.getByDisplayValue('Original') as HTMLInputElement
    await userEvent.clear(editInput)
    await userEvent.type(editInput, 'Updated title')

    // Save by clicking Save button
    const saveButton = screen.getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)

    await waitFor(() => screen.getByText('Updated title'))
    expect(screen.queryByText('Original')).toBeNull()
  })

  it('Completed tasks can be cleared', async () => {
    // Initial load with one active and one completed task
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 1, title: 'Active task', completed: false },
          { id: 2, title: 'Done task', completed: true },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    // DELETE for completed task
    mockFetch.mockResolvedValueOnce(
      new Response('', {
        status: 204,
      }),
    )

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Active task')).toBeInTheDocument()
      expect(screen.getByText('Done task')).toBeInTheDocument()
    })

    const clearButton = screen.getByRole('button', { name: /clear completed/i })
    await userEvent.click(clearButton)

    await waitFor(() => {
      expect(screen.getByText('Active task')).toBeInTheDocument()
      expect(screen.queryByText('Done task')).toBeNull()
    })
  })

  it('Filtering tasks by "active" status returns only active tasks', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 1, title: 'Active 1', completed: false },
          { id: 2, title: 'Done 1', completed: true },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Active 1')).toBeInTheDocument()
      expect(screen.getByText('Done 1')).toBeInTheDocument()
    })

    const activeFilter = screen.getByRole('button', { name: /active/i })
    await userEvent.click(activeFilter)

    await waitFor(() => {
      expect(screen.getByText('Active 1')).toBeInTheDocument()
      expect(screen.queryByText('Done 1')).toBeNull()
    })
  })

  it('Filtering tasks by "completed" status returns only completed tasks', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 1, title: 'Active 1', completed: false },
          { id: 2, title: 'Done 1', completed: true },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Active 1')).toBeInTheDocument()
      expect(screen.getByText('Done 1')).toBeInTheDocument()
    })

    const completedFilter = screen.getByRole('button', { name: /completed/i })
    await userEvent.click(completedFilter)

    await waitFor(() => {
      expect(screen.getByText('Done 1')).toBeInTheDocument()
      expect(screen.queryByText('Active 1')).toBeNull()
    })
  })
})
