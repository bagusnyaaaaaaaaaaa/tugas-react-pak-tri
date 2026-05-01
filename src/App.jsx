import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function App() {
  const [session, setSession] = useState(null)
  const [todos, setTodos] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [task, setTask] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setTodos([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchTodos()
    }
  }, [session])

  async function fetchTodos() {
    const { data, error } = await supabase
      .from('todos')
      .select('id, task, is_done, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }
    setTodos(data ?? [])
  }

  async function handleSignUp(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Registrasi berhasil. Cek email verifikasi jika confirm email aktif.')
    }
    setLoading(false)
  }

  async function handleSignIn(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Login berhasil.')
    }
    setLoading(false)
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) setMessage(error.message)
  }

  async function handleAddTodo(event) {
    event.preventDefault()
    if (!task.trim() || !session?.user) return

    const { error } = await supabase.from('todos').insert({
      user_id: session.user.id,
      task: task.trim(),
    })

    if (error) {
      setMessage(error.message)
      return
    }
    setTask('')
    fetchTodos()
  }

  async function handleToggleTodo(todo) {
    const { error } = await supabase
      .from('todos')
      .update({ is_done: !todo.is_done })
      .eq('id', todo.id)

    if (error) {
      setMessage(error.message)
      return
    }
    fetchTodos()
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Todo App - Bagus Sugi Yanto (230101127)</h1>
      <p>Demo todo app dengan auth dan database Supabase.</p>
      
      {message && <p><b>{message}</b></p>}
      
      {!session ? (
        <form onSubmit={handleSignIn} style={{ display: 'grid', gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={loading}>Login</button>
            <button type="button" onClick={handleSignUp} disabled={loading}>Register</button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>Login sebagai: {session.user.email}</p>
            <button onClick={handleSignOut}>Logout</button>
          </div>
          <form onSubmit={handleAddTodo} style={{ display: 'flex', gap: 12, margin: '20px 0' }}>
            <input type="text" placeholder="Tambah todo" value={task} onChange={(e) => setTask(e.target.value)} style={{ flex: 1 }} />
            <button type="submit">Tambah</button>
          </form>
          <ul style={{ padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
            {todos.map((todo) => (
              <li key={todo.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, border: '1px solid #ddd', borderRadius: 12 }}>
                <span style={{ textDecoration: todo.is_done ? 'line-through' : 'none' }}>{todo.task}</span>
                <button onClick={() => handleToggleTodo(todo)}>{todo.is_done ? 'Batalkan' : 'Selesai'}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}