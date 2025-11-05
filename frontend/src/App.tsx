import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Dashboard from './pages/Dashboard/Dashboard'
import Deliveries from './pages/Deliveries/Deliveries'
import CreateDelivery from './pages/CreateDelivery/CreateDelivery'
import TrackDelivery from './pages/TrackDelivery/TrackDelivery'
import DeliveryDetail from './pages/DeliveryDetail/DeliveryDetail'
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
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/deliveries/create" element={<CreateDelivery />} />
          <Route path="/deliveries/:id" element={<DeliveryDetail />} />
          <Route path="/track" element={<TrackDelivery />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
