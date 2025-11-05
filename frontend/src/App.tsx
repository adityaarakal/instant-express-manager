import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Dashboard from './pages/Dashboard/Dashboard'
import Expenses from './pages/Expenses/Expenses'
import CreateExpense from './pages/CreateExpense/CreateExpense'
import ExpenseDetail from './pages/ExpenseDetail/ExpenseDetail'
import './App.css'

function App() {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration)
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError)
          })
      })
    }
  }, [])

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/create" element={<CreateExpense />} />
          <Route path="/expenses/:id" element={<ExpenseDetail />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
