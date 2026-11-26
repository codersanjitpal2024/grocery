import * as billingRepository from '../repository/billingRepository.js';
import * as productService from './productService.js';
import Product from '../model/Product.js';

export const createInvoice = async (data, authHeader) => {
    const { fullName, phoneNumber, shopId, products } = data;
    // Call Products service to deduct stock directly
    if (products && products.length > 0) {
        // Populate purchasePrice and pricePerUnit/subTotal for historical accuracy
        const productIds = products.map(p => p.productId);
        const dbProducts = await Product.find({ _id: { $in: productIds } });
        const purchasePriceMap = {};
        const sellingPriceMap = {};
        const productNameMap = {};
        const unitMap = {};
        dbProducts.forEach(p => {
            purchasePriceMap[p._id.toString()] = p.purchasePrice;
            sellingPriceMap[p._id.toString()] = p.sellingPrice;
            productNameMap[p._id.toString()] = p.name;
            unitMap[p._id.toString()] = p.baseUnit;
        });
        
        let calculatedTotal = 0;
        let calculatedCost = 0;
        products.forEach(p => {
            const prodIdStr = p.productId ? p.productId.toString() : '';
            if (!p.productName && productNameMap[prodIdStr]) {
                p.productName = productNameMap[prodIdStr];
            }
            if (!p.unit && unitMap[prodIdStr]) {
                p.unit = unitMap[prodIdStr];
            }
            if (p.purchasePrice === undefined || p.purchasePrice === null) {
                p.purchasePrice = purchasePriceMap[prodIdStr] ?? 0;
            }
            if (p.pricePerUnit === undefined || p.pricePerUnit === null) {
                p.pricePerUnit = sellingPriceMap[prodIdStr] ?? 0;
            }

            const quantity = Number(p.quantity) || 0;
            const pricePerUnit = Number(p.pricePerUnit) || 0;
            const purchasePrice = Number(p.purchasePrice) || 0;

            if (p.subTotal === undefined || p.subTotal === null || Number(p.subTotal) === 0) {
                p.subTotal = Math.round(pricePerUnit * quantity * 100) / 100;
            } else {
                p.subTotal = Number(p.subTotal);
            }

            p.costTotal = Math.round(purchasePrice * quantity * 100) / 100;
            p.profit = Math.round((p.subTotal - p.costTotal) * 100) / 100;

            calculatedTotal += p.subTotal;
            calculatedCost += p.costTotal;
        });

        if (!data.totalAmount || Number(data.totalAmount) === 0) {
            data.totalAmount = Math.round(calculatedTotal * 100) / 100;
        } else {
            data.totalAmount = Number(data.totalAmount);
        }
        data.totalCost = Math.round(calculatedCost * 100) / 100;
        data.profitOrLoss = Math.round((data.totalAmount - calculatedCost) * 100) / 100;

        try {
            await productService.bulkDeductStock(shopId, products);
        } catch (error) {
            console.error("Failed to deduct stock:", error.message);
            throw new Error(`Products deduction failed: ` + error.message);
        }
    }
    return await billingRepository.create(data, authHeader);
};

export const getInvoiceById = async (id) => {
    return await billingRepository.findById(id);
};

export const getInvoicesByCustomer = async (customerId) => {
    return await billingRepository.findByCustomerId(customerId);
};

export const getInvoicesByShop = async (shopId) => {
    return await billingRepository.findByShopId(shopId);
};

export const updatePayment = async (id, paidAmount, dueAmount) => {
    return await billingRepository.updatePayment(id, paidAmount, dueAmount);
};

export const getDailyProfitAndLoss = async (shopId, startDate, endDate) => {
    return await billingRepository.getDailyProfitAndLoss(shopId, startDate, endDate);
};

export const getTodayBillingProfitAndLoss = async (shopId, date) => {
    return await billingRepository.getTodayInvoicesWithProfitLoss(shopId, date);
};
