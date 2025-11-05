import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Dashboard from './pages/Dashboard/Dashboard'
import Expenses from './pages/Expenses/Expenses'
import CreateExpense from './pages/CreateExpense/CreateExpense'
import ExpenseDetail from './pages/ExpenseDetail/ExpenseDetail'
import IncomeList from './pages/IncomeList/IncomeList'
import CreateIncome from './pages/CreateIncome/CreateIncome'
import IncomeDetail from './pages/IncomeDetail/IncomeDetail'
import './App.css'

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/create" element={<CreateExpense />} />
          <Route path="/expenses/:id" element={<ExpenseDetail />} />
          <Route path="/income" element={<IncomeList />} />
          <Route path="/income/create" element={<CreateIncome />} />
          <Route path="/income/:id" element={<IncomeDetail />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
