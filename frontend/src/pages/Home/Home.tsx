import React from 'react'
import { Link } from 'react-router-dom'
import AdBanner from '../../components/AdBanner/AdBanner'
import PurchaseButton from '../../components/PurchaseButton/PurchaseButton'
import './Home.css'

const Home: React.FC = () => {
  return (
    <div className="home">
      <div className="container">
        <section className="hero">
          <h1>💰 Expense Manager</h1>
          <p className="hero-subtitle">
            Track, manage, and analyze your expenses with ease
          </p>
          <div className="hero-actions">
            <Link to="/expenses/create" className="btn btn-primary">Add Expense</Link>
            <Link to="/dashboard" className="btn btn-secondary">View Dashboard</Link>
          </div>
        </section>

        <AdBanner />

        <section className="features">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>📊 Smart Tracking</h3>
              <p>Track all your expenses by category and date</p>
            </div>
            <div className="feature-card">
              <h3>📈 Analytics</h3>
              <p>View detailed insights and spending patterns</p>
            </div>
            <div className="feature-card">
              <h3>🏷️ Categories</h3>
              <p>Organize expenses with tags and categories</p>
            </div>
          </div>
        </section>

        <section className="premium">
          <h2>Unlock Premium Features</h2>
          <p>Get access to exclusive features and remove ads</p>
          <PurchaseButton />
        </section>
      </div>
    </div>
  )
}

export default Home
