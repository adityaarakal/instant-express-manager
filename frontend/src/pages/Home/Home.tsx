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
          <h1>Welcome to Instant Express Manager</h1>
          <p className="hero-subtitle">
            Manage your express deliveries and services efficiently
          </p>
          <div className="hero-actions">
            <Link to="/deliveries/create" className="btn btn-primary">Create Delivery</Link>
            <Link to="/dashboard" className="btn btn-secondary">View Dashboard</Link>
          </div>
        </section>

        <AdBanner />

        <section className="features">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Fast Delivery</h3>
              <p>Express delivery services at your fingertips</p>
            </div>
            <div className="feature-card">
              <h3>Real-time Tracking</h3>
              <p>Track your packages in real-time</p>
            </div>
            <div className="feature-card">
              <h3>Secure Payments</h3>
              <p>Safe and secure payment processing</p>
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
