import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

interface Todo {
  _id: string
  text: string
  completed: boolean
  priority: string
  dueDate?: string
  createdAt: string
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [dailyTodos, setDailyTodos] = useState<Todo[]>([])
  const [completedToday, setCompletedToday] = useState<Todo[]>([])
  const [workDone, setWorkDone] = useState({ total: 0, completed: 0, percentage: 0 })

  useEffect(() => {
    fetchTodos()
    fetchDailyData()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/todos')
      setTodos(response.data)
    } catch (error) {
      console.error('Error fetching todos:', error)
    }
  }

  const fetchDailyData = async () => {
    try {
      const [dailyRes, completedRes, workRes] = await Promise.all([
        axios.get('http://localhost:5000/api/daily'),
        axios.get('http://localhost:5000/api/completed-today'),
        axios.get('http://localhost:5000/api/work-done-today')
      ])
      setDailyTodos(dailyRes.data)
      setCompletedToday(completedRes.data)
      setWorkDone(workRes.data)
    } catch (error) {
      console.error('Error fetching daily data:', error)
    }
  }

  const addTodo = async () => {
    if (input.trim()) {
      try {
        const newTodo = {
          text: input.trim(),
          priority,
          dueDate: dueDate || null
        }
        const response = await axios.post('http://localhost:5000/api/todos', newTodo)
        setTodos([...todos, response.data])
        setInput('')
        setDueDate('')
        fetchDailyData()
      } catch (error) {
        console.error('Error adding todo:', error)
        alert('Failed to add todo. Please check if the backend is running.')
      }
    }
  }

  const toggleComplete = async (id: string) => {
    try {
      const todo = todos.find(t => t._id === id)
      if (todo) {
        const response = await axios.put(`http://localhost:5000/api/todos/${id}`, {
          completed: !todo.completed
        })
        setTodos(todos.map(t => t._id === id ? response.data : t))
        fetchDailyData()
      }
    } catch (error) {
      console.error('Error toggling todo:', error)
      alert('Failed to update todo status.')
    }
  }

  const editTodo = async (id: string) => {
    const newText = prompt('Edit todo:', todos.find(t => t._id === id)?.text)
    if (newText && newText.trim()) {
      try {
        const response = await axios.put(`http://localhost:5000/api/todos/${id}`, {
          text: newText.trim()
        })
        setTodos(todos.map(t => t._id === id ? response.data : t))
      } catch (error) {
        console.error('Error editing todo:', error)
        alert('Failed to edit todo.')
      }
    }
  }

  const deleteTodo = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await axios.delete(`http://localhost:5000/api/todos/${id}`)
        setTodos(todos.filter(t => t._id !== id))
        fetchDailyData()
      } catch (error) {
        console.error('Error deleting todo:', error)
        alert('Failed to delete todo.')
      }
    }
  }

  return (
    <div className="app">
      <h1>Todo App</h1>
      <div className="todo-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new todo"
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <span>{todo.text}</span>
            <span className={`priority ${todo.priority}`}>{todo.priority}</span>
            <button onClick={() => toggleComplete(todo._id)}>
              {todo.completed ? 'Uncomplete' : 'Complete'}
            </button>
            <button onClick={() => editTodo(todo._id)}>Edit</button>
            <button onClick={() => deleteTodo(todo._id)}>Delete</button>
          </li>
        ))}
      </ul>

      <div className="stats">
        <h2>Today's Work</h2>
        <p>Total tasks: {workDone.total}</p>
        <p>Completed: {workDone.completed}</p>
        <p>Progress: {workDone.percentage.toFixed(1)}%</p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${workDone.percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="daily-section">
        <h2>Daily Tasks</h2>
        <ul className="todo-list">
          {dailyTodos.map((todo) => (
            <li key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <span>{todo.text}</span>
              <span className={`priority ${todo.priority}`}>{todo.priority}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="completed-section">
        <h2>Completed Today</h2>
        <ul className="todo-list">
          {completedToday.map((todo) => (
            <li key={todo._id} className="todo-item completed">
              <span>{todo.text}</span>
              <span className={`priority ${todo.priority}`}>{todo.priority}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App
