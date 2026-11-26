import * as dueBillingService from '../services/dueBillingService.js';

export const addDueBilling = async (req, res) => {
    try {
        const { customerId, shopId, amount, fullName, phoneNumber } = req.body;
        
        if (!shopId || amount === undefined) {
            return res.status(400).json({ message: "shopId and amount are required." });
        }

        const dueBilling = await dueBillingService.addDueBilling(req.body);
        res.status(201).json(dueBilling);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDueBillingByShop = async (req, res) => {
    try {
        const dues = await dueBillingService.getDueBillingByShop(req.params.shopId);
        res.status(200).json(dues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDueBillingByCustomer = async (req, res) => {
    try {
        const dues = await dueBillingService.getDueBillingByCustomer(req.params.customerId);
        res.status(200).json(dues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const clearDueBilling = async (req, res) => {
    try {
        const { customerId, shopId, amount } = req.body;

        if (!customerId || !shopId || amount === undefined) {
            return res.status(400).json({ message: "customerId, shopId, and amount are required." });
        }

        const dueBilling = await dueBillingService.clearDueBilling(req.body);
        res.status(201).json(dueBilling);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
