const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const TODOS_FILE = path.join(__dirname, 'todos.json');

// Helper functions
const readTodos = () => {
  try {
    const data = fs.readFileSync(TODOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeTodos = (todos) => {
  fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2));
};

// Routes
app.get('/api/todos', (req, res) => {
  const todos = readTodos();
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const todos = readTodos();
  const newTodo = {
    _id: Date.now().toString(),
    text: req.body.text,
    completed: req.body.completed || false,
    priority: req.body.priority || 'medium',
    dueDate: req.body.dueDate || null,
    createdAt: new Date().toISOString()
  };
  todos.push(newTodo);
  writeTodos(todos);
  res.json(newTodo);
});

app.put('/api/todos/:id', (req, res) => {
  const todos = readTodos();
  const todoIndex = todos.findIndex(t => t._id === req.params.id);
  if (todoIndex !== -1) {
    todos[todoIndex] = { ...todos[todoIndex], ...req.body };
    writeTodos(todos);
    res.json(todos[todoIndex]);
  } else {
    res.status(404).json({ message: 'Todo not found' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  const todos = readTodos();
  const filteredTodos = todos.filter(t => t._id !== req.params.id);
  if (filteredTodos.length < todos.length) {
    writeTodos(filteredTodos);
    res.json({ message: 'Todo deleted' });
  } else {
    res.status(404).json({ message: 'Todo not found' });
  }
});

// Daily tasks
app.get('/api/daily', (req, res) => {
  const todos = readTodos();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dailyTodos = todos.filter(todo => {
    const createdAt = new Date(todo.createdAt);
    return createdAt >= today && createdAt < tomorrow;
  });
  res.json(dailyTodos);
});

// Completed tasks today
app.get('/api/completed-today', (req, res) => {
  const todos = readTodos();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const completedToday = todos.filter(todo => {
    const createdAt = new Date(todo.createdAt);
    return todo.completed && createdAt >= today && createdAt < tomorrow;
  });
  res.json(completedToday);
});

// Work done today
app.get('/api/work-done-today', (req, res) => {
  const todos = readTodos();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysTodos = todos.filter(todo => {
    const createdAt = new Date(todo.createdAt);
    return createdAt >= today && createdAt < tomorrow;
  });

  const totalTodos = todaysTodos.length;
  const completedTodos = todaysTodos.filter(todo => todo.completed).length;

  res.json({
    total: totalTodos,
    completed: completedTodos,
    percentage: totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0,
  });
});

// Calendar-wise tasks
app.get('/api/calendar/:date', (req, res) => {
  const todos = readTodos();
  const date = new Date(req.params.date);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const tasks = todos.filter(todo => {
    if (!todo.dueDate) return false;
    const dueDate = new Date(todo.dueDate);
    return dueDate >= date && dueDate < nextDay;
  });
  res.json(tasks);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
