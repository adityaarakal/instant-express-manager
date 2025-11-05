import React, { useState } from 'react'
import './Header.css'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-logo">
            <h1>Instant Express Manager</h1>
          </div>
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
            <a href="/" className="nav-link">Home</a>
            <a href="/services" className="nav-link">Services</a>
            <a href="/about" className="nav-link">About</a>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
