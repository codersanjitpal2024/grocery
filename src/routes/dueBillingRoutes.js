import express from 'express';
import * as dueBillingController from '../controller/dueBillingController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

/**
 * @swagger
 * /api/due-billing:
 *   post:
 *     summary: Add due billing for a customer
 *     tags: [DueBilling]
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
 *               amount:
 *                 type: number
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Due billing added successfully
 *       400:
 *         description: Bad Request
 */
router.post('/', verifyToken, dueBillingController.addDueBilling);

/**
 * @swagger
 * /api/due-billing/clear:
 *   post:
 *     summary: Clear a specific amount from a customer's due
 *     tags: [DueBilling]
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
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Due cleared successfully
 *       400:
 *         description: Bad Request (e.g., amount exceeds current due)
 *       404:
 *         description: Customer not found
 */
router.post('/clear', verifyToken, dueBillingController.clearDueBilling);

/**
 * @swagger
 * /api/due-billing/shop/{shopId}:
 *   get:
 *     summary: Get due billing records by shop ID
 *     tags: [DueBilling]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of due billing records
 */
router.get('/shop/:shopId', verifyToken, dueBillingController.getDueBillingByShop);

/**
 * @swagger
 * /api/due-billing/customer/{customerId}:
 *   get:
 *     summary: Get due billing records by customer ID
 *     tags: [DueBilling]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of due billing records
 */
router.get('/customer/:customerId', verifyToken, dueBillingController.getDueBillingByCustomer);

export default router;
