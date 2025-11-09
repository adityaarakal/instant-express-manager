import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="header-logo">
            <h1>💰 Finance Manager</h1>
          </Link>
          <button
            className="header-menu-toggle"
            aria-label="Toggle menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              Dashboard
            </Link>
            <Link
              to="/planned-expenses"
              className={`nav-link ${
                isActive('/planned-expenses') || location.pathname.startsWith('/planned-expenses') ? 'active' : ''
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Planned
            </Link>
            <Link
              to="/accounts"
              className={`nav-link ${isActive('/accounts') || location.pathname.startsWith('/accounts') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Accounts
            </Link>
            <Link to="/income" className={`nav-link ${isActive('/income') || location.pathname.startsWith('/income') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              Income
            </Link>
            <Link to="/expenses" className={`nav-link ${isActive('/expenses') || location.pathname.startsWith('/expenses') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              Expenses
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
