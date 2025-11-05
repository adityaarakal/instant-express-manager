import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { purchasePremium, checkPurchaseStatus } from '../controllers/purchase.controller'

const router = Router()

// POST /api/purchases/premium - Purchase premium subscription
router.post(
  '/premium',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('productId').notEmpty().withMessage('Product ID is required')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      })
    }

    try {
      const result = await purchasePremium(req.body)
      res.status(result.success ? 200 : 400).json(result)
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Internal server error' 
      })
    }
  }
)

// GET /api/purchases/status/:userId - Check purchase status
router.get('/status/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const hasPremium = await checkPurchaseStatus(userId)
    res.json({ hasPremium })
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
})

export default router
