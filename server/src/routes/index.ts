import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { orderController } from '../controllers/order.controller'
import { auditController } from '../controllers/audit.controller'
import { aiController } from '../controllers/ai.controller'
import { shopController } from '../controllers/shop.controller'
import { paymentController } from '../controllers/payment.controller'
import { authenticate, authorizeRoles } from '../middleware/auth'

export const apiRouter = Router()

apiRouter.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

apiRouter.post('/auth/register', authController.register)
apiRouter.post('/auth/login', authController.login)
apiRouter.get('/users/me', authenticate, authController.me)
apiRouter.get('/admin/users', authenticate, authorizeRoles('ADMIN'), authController.listUsers)

apiRouter.get('/products', shopController.listProducts)
apiRouter.get('/products/:productId', shopController.getProductById)
apiRouter.post('/admin/products', authenticate, authorizeRoles('ADMIN'), shopController.createProduct)
apiRouter.patch('/admin/products/:productId', authenticate, authorizeRoles('ADMIN'), shopController.updateProduct)
apiRouter.delete('/admin/products/:productId', authenticate, authorizeRoles('ADMIN'), shopController.deleteProduct)
apiRouter.get('/categories', shopController.listCategories)
apiRouter.get('/favorites', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), shopController.listFavorites)
apiRouter.post('/favorites', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), shopController.addFavorite)
apiRouter.delete(
  '/favorites/:productId',
  authenticate,
  authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'),
  shopController.removeFavorite,
)

apiRouter.get('/cart', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), shopController.listCart)
apiRouter.post('/cart', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), shopController.addToCart)
apiRouter.patch(
  '/cart/:productId',
  authenticate,
  authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'),
  shopController.updateCartItem,
)
apiRouter.post('/cart/apply-promo', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), shopController.applyPromo)
apiRouter.delete('/cart/promo', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), shopController.clearPromo)
apiRouter.delete(
  '/cart/:productId',
  authenticate,
  authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'),
  shopController.removeFromCart,
)

apiRouter.get('/admin/promo-codes', authenticate, authorizeRoles('ADMIN'), shopController.listPromoCodes)
apiRouter.post('/admin/promo-codes', authenticate, authorizeRoles('ADMIN'), shopController.createPromoCode)
apiRouter.patch('/admin/promo-codes/:promoId', authenticate, authorizeRoles('ADMIN'), shopController.updatePromoCode)
apiRouter.delete('/admin/promo-codes/:promoId', authenticate, authorizeRoles('ADMIN'), shopController.deletePromoCode)

apiRouter.post('/orders', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), orderController.create)
apiRouter.post('/orders/checkout', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), orderController.checkoutWithPayment)
apiRouter.post('/payments/yookassa/webhook', paymentController.handleYooKassaWebhook)
apiRouter.get('/orders/my', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), orderController.myOrders)
apiRouter.get('/orders/:orderId', authenticate, authorizeRoles('CLIENT', 'OPERATOR', 'ADMIN'), orderController.getById)
apiRouter.patch(
  '/orders/:orderId/status',
  authenticate,
  authorizeRoles('ADMIN', 'OPERATOR', 'MANAGER'),
  orderController.updateStatus,
)

apiRouter.get('/audit', authenticate, authorizeRoles('ADMIN', 'MANAGER'), auditController.list)
apiRouter.get('/ai/forecast', authenticate, authorizeRoles('ADMIN', 'MANAGER'), aiController.forecast)