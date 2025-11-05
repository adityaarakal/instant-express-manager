import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import purchaseRoutes from './routes/purchase.routes'
import expenseRoutes from './routes/expense.routes'
import { errorHandler } from './middleware/errorHandler'
import { connectDatabase, isDatabaseConnected } from './config/database'

// Load environment variables
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3000

// Connect to database (non-blocking)
connectDatabase().catch(err => {
  console.warn('Database connection will be retried automatically')
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Expense Manager API is running',
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.use('/api/purchases', purchaseRoutes)
app.use('/api/expenses', expenseRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  })
})

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
})
