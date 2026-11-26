import express from 'express';
import { 
    createInvoice, 
    getInvoiceById, 
    getCustomerInvoices, 
    getShopInvoices, 
    updatePayment,
    getDailyProfitAndLoss,
    getTodayBillingProfitAndLoss
} from '../controller/billingController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

/**
 * @swagger
 * /api/billing/today/{shopId}:
 *   get:
 *     summary: Get today's all invoices with profit and loss details
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: false
 *         description: Specific date (defaults to today YYYY-MM-DD)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Today's invoices with item-level cost, selling price, profit, and overall summary
 */
router.get('/today/:shopId', verifyToken, getTodayBillingProfitAndLoss);

/**
 * @swagger
 * /api/billing/profit-loss/today/{shopId}:
 *   get:
 *     summary: Get today's all invoices with profit and loss details (alias)
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Today's invoices with item-level cost, selling price, profit, and overall summary
 */
router.get('/profit-loss/today/:shopId', verifyToken, getTodayBillingProfitAndLoss);

/**
 * @swagger
 * /api/billing:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *               shopId:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     pricePerUnit:
 *                       type: number
 *                     subTotal:
 *                       type: number
 *               totalAmount:
 *                 type: string
 *               dueAmount:
 *                 type: string
 *               paidAmount:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice created successfully
 */
router.post('/', verifyToken, createInvoice);

/**
 * @swagger
 * /api/billing/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details
 */
router.get('/:id', verifyToken, getInvoiceById);

/**
 * @swagger
 * /api/billing/customer/{customerId}:
 *   get:
 *     summary: Get all invoices for a customer
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of customer invoices
 */
router.get('/customer/:customerId', verifyToken, getCustomerInvoices);

/**
 * @swagger
 * /api/billing/shop/{shopId}:
 *   get:
 *     summary: Get all invoices for a shop
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of shop invoices
 */
router.get('/shop/:shopId', verifyToken, getShopInvoices);

/**
 * @swagger
 * /api/billing/{id}/payment:
 *   put:
 *     summary: Update payment details for an invoice
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paidAmount:
 *                 type: string
 *               dueAmount:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated
 */
router.put('/:id/payment', verifyToken, updatePayment);

/**
 * @swagger
 * /api/billing/profit-loss/{shopId}:
 *   get:
 *     summary: Get daily profit and loss for a shop
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: false
 *         description: Specific date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Daily profit and loss data
 */
router.get('/profit-loss/:shopId', verifyToken, getDailyProfitAndLoss);

export default router;
