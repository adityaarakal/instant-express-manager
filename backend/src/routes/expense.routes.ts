import { Router, Request, Response } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import {
  createExpense,
  getExpenseById,
  getUserExpenses,
  updateExpense,
  deleteExpense,
  getExpenseStats
} from '../controllers/expense.controller'

const router = Router()

// GET /api/expenses/stats - Get expense statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default-user'
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined
    
    const stats = await getExpenseStats(userId, startDate, endDate)
    res.json(stats)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/expenses - Get all expenses for user
router.get(
  '/',
  [
    query('userId').optional().isString(),
    query('category').optional().isIn(['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'travel', 'other']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const userId = (req.query.userId as string) || 'default-user'
      const category = req.query.category as string | undefined
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined
      const limit = parseInt(req.query.limit as string) || 100
      const skip = parseInt(req.query.skip as string) || 0

      const expenses = await getUserExpenses(userId, category, startDate, endDate, limit, skip)
      res.json(expenses)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// GET /api/expenses/:id - Get expense by ID
router.get(
  '/:id',
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const userId = req.query.userId as string || 'default-user'
      const expense = await getExpenseById(req.params.id, userId)
      
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' })
      }
      
      res.json(expense)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// POST /api/expenses - Create new expense
router.post(
  '/',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('category').isIn(['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'travel', 'other']).withMessage('Invalid category'),
    body('paymentMethod').optional().isIn(['cash', 'card', 'digital_wallet', 'bank_transfer', 'other']),
    body('date').isISO8601().withMessage('Invalid date format')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const expense = await createExpense(req.body)
      res.status(201).json(expense)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// PUT /api/expenses/:id - Update expense
router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('title').optional().trim().notEmpty(),
    body('amount').optional().isFloat({ min: 0 }),
    body('category').optional().isIn(['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'travel', 'other']),
    body('paymentMethod').optional().isIn(['cash', 'card', 'digital_wallet', 'bank_transfer', 'other']),
    body('date').optional().isISO8601()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const userId = req.body.userId || 'default-user'
      const expense = await updateExpense(req.params.id, userId, req.body)
      
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' })
      }
      
      res.json(expense)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// DELETE /api/expenses/:id - Delete expense
router.delete(
  '/:id',
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const userId = req.query.userId as string || 'default-user'
      const deleted = await deleteExpense(req.params.id, userId)
      
      if (!deleted) {
        return res.status(404).json({ error: 'Expense not found' })
      }
      
      res.json({ message: 'Expense deleted successfully' })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

export default router
