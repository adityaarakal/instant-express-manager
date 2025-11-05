import { Router, Request, Response } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import {
  createDelivery,
  getDeliveryById,
  getDeliveryByTrackingNumber,
  getUserDeliveries,
  updateDelivery,
  deleteDelivery,
  getDeliveryStats
} from '../controllers/delivery.controller'

const router = Router()

// GET /api/deliveries/stats - Get delivery statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'default-user' // TODO: Get from auth
    const stats = await getDeliveryStats(userId)
    res.json(stats)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/deliveries - Get all deliveries for user
router.get(
  '/',
  [
    query('userId').optional().isString(),
    query('status').optional().isIn(['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const userId = (req.query.userId as string) || 'default-user' // TODO: Get from auth
      const status = req.query.status as string | undefined
      const limit = parseInt(req.query.limit as string) || 50
      const skip = parseInt(req.query.skip as string) || 0

      const deliveries = await getUserDeliveries(userId, status, limit, skip)
      res.json(deliveries)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// GET /api/deliveries/tracking/:trackingNumber - Get delivery by tracking number
router.get(
  '/tracking/:trackingNumber',
  [param('trackingNumber').isString().notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { trackingNumber } = req.params
      const delivery = await getDeliveryByTrackingNumber(trackingNumber)
      
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' })
      }
      
      res.json(delivery)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// GET /api/deliveries/:id - Get delivery by ID
router.get(
  '/:id',
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const userId = req.query.userId as string || 'default-user' // TODO: Get from auth
      const delivery = await getDeliveryById(req.params.id, userId)
      
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' })
      }
      
      res.json(delivery)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// POST /api/deliveries - Create new delivery
router.post(
  '/',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('senderName').notEmpty().withMessage('Sender name is required'),
    body('senderAddress').notEmpty().withMessage('Sender address is required'),
    body('senderPhone').notEmpty().withMessage('Sender phone is required'),
    body('recipientName').notEmpty().withMessage('Recipient name is required'),
    body('recipientAddress').notEmpty().withMessage('Recipient address is required'),
    body('recipientPhone').notEmpty().withMessage('Recipient phone is required'),
    body('packageType').isIn(['document', 'parcel', 'express', 'fragile', 'heavy']).withMessage('Invalid package type'),
    body('packageWeight').isFloat({ min: 0 }).withMessage('Package weight must be a positive number'),
    body('priority').isIn(['standard', 'express', 'urgent']).withMessage('Invalid priority'),
    body('estimatedDelivery').isISO8601().withMessage('Invalid estimated delivery date')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const delivery = await createDelivery(req.body)
      res.status(201).json(delivery)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// PUT /api/deliveries/:id - Update delivery
router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('status').optional().isIn(['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled']),
    body('actualDelivery').optional().isISO8601(),
    body('deliveryNotes').optional().isString()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const userId = req.body.userId || 'default-user' // TODO: Get from auth
      const delivery = await updateDelivery(req.params.id, userId, req.body)
      
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' })
      }
      
      res.json(delivery)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

// DELETE /api/deliveries/:id - Delete delivery
router.delete(
  '/:id',
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const userId = req.query.userId as string || 'default-user' // TODO: Get from auth
      const deleted = await deleteDelivery(req.params.id, userId)
      
      if (!deleted) {
        return res.status(404).json({ error: 'Delivery not found' })
      }
      
      res.json({ message: 'Delivery deleted successfully' })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

export default router
