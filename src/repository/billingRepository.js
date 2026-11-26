import Billing from '../model/Billing.js';
import Customer from '../model/Customer.js';
import Product from '../model/Product.js';
import axios from 'axios';
import mongoose from 'mongoose';

export const create = async (billingData, authHeader) => {
    if (!billingData.customerId) {
        const fullName = billingData.fullName || "Walk-in Customer";
        const phoneNumber = billingData.phoneNumber || "0000000000";
        const shopId = billingData.shopId;
        const dueamount = billingData.dueAmount;

        let customerId;
        try {
            const customerDoc = await Customer.create({
                fullName,
                phoneNumber,
                shopId,
                dueamount
            });
            customerId = customerDoc._id.toString();
        } catch (err) {
            throw new Error(`Database error creating walk-in customer: ` + err.message);
        }

        if(!customerId) {
            throw new Error("Customer creation failed"); 
        }
        billingData.customerId = customerId;
    }

    return await Billing.create(billingData);
};
export const findById = async (id) => {
    return await Billing.findById(id);
};
export const findByCustomerId = async (customerId) => {
    return await Billing.find({ customerId });
};
export const findByShopId = async (shopId) => {
    return await Billing.find({ shopId });
};
export const updatePayment = async (id, paidAmount, dueAmount) => {
    return await Billing.findByIdAndUpdate(id, { paidAmount, dueAmount }, { new: true });
};

export const getDailyProfitAndLoss = async (shopId, startDate, endDate) => {
    const todayIso = new Date().toISOString().split('T')[0];
    if (startDate === 'today') startDate = todayIso;
    if (endDate === 'today') endDate = todayIso;

    const matchStage = {
        $or: [
            { shopId: shopId },
            { shopId: shopId.toString() },
            ...(mongoose.Types.ObjectId.isValid(shopId) ? [{ shopId: new mongoose.Types.ObjectId(shopId) }] : [])
        ]
    };

    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) {
            matchStage.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            if (typeof endDate === 'string' && endDate.length <= 10) {
                end.setUTCHours(23, 59, 59, 999);
            }
            matchStage.createdAt.$lte = end;
        }
    }

    const pipeline = [
        { $match: matchStage },
        { $unwind: { path: "$products", preserveNullAndEmptyArrays: true } },
        { 
            $addFields: { 
                productObjectId: { 
                    $convert: {
                        input: "$products.productId",
                        to: "objectId",
                        onError: null,
                        onNull: null
                    }
                }
            } 
        },
        {
            $lookup: {
                from: "products", 
                localField: "productObjectId",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                itemQuantity: {
                    $convert: {
                        input: "$products.quantity",
                        to: "double",
                        onError: 1,
                        onNull: 1
                    }
                },
                itemPurchasePrice: {
                    $convert: {
                        input: {
                            $ifNull: [
                                "$products.purchasePrice", 
                                { $ifNull: ["$productDetails.purchasePrice", 0] }
                            ]
                        },
                        to: "double",
                        onError: 0,
                        onNull: 0
                    }
                },
                itemSubTotal: {
                    $convert: {
                        input: { $ifNull: ["$products.subTotal", "$products.subtotal"] },
                        to: "double",
                        onError: 0,
                        onNull: 0
                    }
                },
                itemPricePerUnit: {
                    $convert: {
                        input: {
                            $ifNull: [
                                "$products.pricePerUnit",
                                { $ifNull: ["$products.sellingPrice", { $ifNull: ["$productDetails.sellingPrice", 0] }] }
                            ]
                        },
                        to: "double",
                        onError: 0,
                        onNull: 0
                    }
                },
                invoiceTotalAmount: {
                    $convert: {
                        input: "$totalAmount",
                        to: "double",
                        onError: 0,
                        onNull: 0
                    }
                }
            }
        },
        {
            $addFields: {
                calculatedItemCost: {
                    $multiply: ["$itemPurchasePrice", "$itemQuantity"]
                },
                calculatedItemSales: {
                    $cond: {
                        if: { $gt: ["$itemSubTotal", 0] },
                        then: "$itemSubTotal",
                        else: {
                            $cond: {
                                if: { $gt: ["$itemPricePerUnit", 0] },
                                then: { $multiply: ["$itemPricePerUnit", "$itemQuantity"] },
                                else: 0
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                date: { $first: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
                invoiceTotalAmount: { $first: "$invoiceTotalAmount" },
                invoiceCost: { $sum: "$calculatedItemCost" },
                invoiceProductsSales: { $sum: "$calculatedItemSales" }
            }
        },
        {
            $addFields: {
                finalInvoiceSales: {
                    $cond: {
                        if: { $gt: ["$invoiceProductsSales", 0] },
                        then: "$invoiceProductsSales",
                        else: "$invoiceTotalAmount"
                    }
                }
            }
        },
        {
            $group: {
                _id: "$date",
                totalSales: { $sum: "$finalInvoiceSales" },
                totalCost: { $sum: "$invoiceCost" }
            }
        },
        {
            $project: {
                date: "$_id",
                totalSales: { $round: ["$totalSales", 2] },
                totalCost: { $round: ["$totalCost", 2] },
                profitOrLoss: { $round: [{ $subtract: ["$totalSales", "$totalCost"] }, 2] },
                _id: 0
            }
        },
        { $sort: { date: -1 } }
    ];

    return await Billing.aggregate(pipeline);
};

export const getTodayInvoicesWithProfitLoss = async (shopId, targetDate) => {
    let start, end;
    if (targetDate && targetDate !== 'today') {
        start = new Date(targetDate);
        end = new Date(targetDate);
    } else {
        start = new Date();
        end = new Date();
    }
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const matchQuery = {
        $or: [
            { shopId: shopId },
            { shopId: shopId.toString() },
            ...(mongoose.Types.ObjectId.isValid(shopId) ? [{ shopId: new mongoose.Types.ObjectId(shopId) }] : [])
        ],
        createdAt: { $gte: start, $lte: end }
    };

    const invoices = await Billing.find(matchQuery).sort({ createdAt: -1 }).lean();

    // Collect all customerIds and productIds to batch lookup any missing details
    const customerIds = [...new Set(invoices.map(inv => inv.customerId).filter(Boolean))];
    const productIds = [];
    invoices.forEach(inv => {
        (inv.products || []).forEach(p => {
            if (p.productId) productIds.push(p.productId);
        });
    });

    const validCustomerObjIds = customerIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const customers = validCustomerObjIds.length > 0 
        ? await Customer.find({ _id: { $in: validCustomerObjIds } }).lean() 
        : [];
    const customerMap = {};
    customers.forEach(c => {
        customerMap[c._id.toString()] = c;
    });

    const validProductObjIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const dbProducts = validProductObjIds.length > 0 
        ? await Product.find({ _id: { $in: validProductObjIds } }).lean() 
        : [];
    const productMap = {};
    dbProducts.forEach(p => {
        productMap[p._id.toString()] = p;
    });

    let dayTotalSales = 0;
    let dayTotalCost = 0;

    const detailedInvoices = invoices.map(inv => {
        const cust = customerMap[inv.customerId] || {};
        let invTotalSales = 0;
        let invTotalCost = 0;

        const detailedProducts = (inv.products || []).map(p => {
            const dbProd = productMap[p.productId] || {};
            const quantity = Number(p.quantity) || 0;
            const pricePerUnit = Number(p.pricePerUnit ?? dbProd.sellingPrice ?? 0);
            const purchasePrice = Number(p.purchasePrice ?? dbProd.purchasePrice ?? 0);
            const subTotal = (p.subTotal !== undefined && p.subTotal !== null && Number(p.subTotal) > 0)
                ? Number(p.subTotal)
                : Math.round(pricePerUnit * quantity * 100) / 100;
            const costTotal = (p.costTotal !== undefined && p.costTotal !== null && Number(p.costTotal) > 0)
                ? Number(p.costTotal)
                : Math.round(purchasePrice * quantity * 100) / 100;
            const profit = Math.round((subTotal - costTotal) * 100) / 100;

            invTotalSales += subTotal;
            invTotalCost += costTotal;

            return {
                productId: p.productId,
                productName: p.productName || dbProd.name || "Item",
                quantity,
                unit: p.unit || dbProd.baseUnit || "",
                pricePerUnit,
                purchasePrice,
                subTotal,
                costTotal,
                profit
            };
        });

        const finalInvSales = (invTotalSales > 0)
            ? invTotalSales
            : (Number(inv.totalAmount) || 0);

        const invCost = (invTotalCost > 0)
            ? invTotalCost
            : (Number(inv.totalCost) || 0);

        const invProfit = Math.round((finalInvSales - invCost) * 100) / 100;

        dayTotalSales += finalInvSales;
        dayTotalCost += invCost;

        return {
            _id: inv._id,
            customerId: inv.customerId,
            customerName: cust.fullName || "Walk-in Customer",
            phoneNumber: cust.phoneNumber || "",
            createdAt: inv.createdAt,
            totalSales: Math.round(finalInvSales * 100) / 100,
            totalCost: Math.round(invCost * 100) / 100,
            profitOrLoss: invProfit,
            paidAmount: Number(inv.paidAmount) || 0,
            dueAmount: Number(inv.dueAmount) || 0,
            products: detailedProducts
        };
    });

    const summary = {
        date: start.toISOString().split('T')[0],
        totalInvoices: detailedInvoices.length,
        totalSales: Math.round(dayTotalSales * 100) / 100,
        totalCost: Math.round(dayTotalCost * 100) / 100,
        profitOrLoss: Math.round((dayTotalSales - dayTotalCost) * 100) / 100
    };

    return {
        summary,
        invoices: detailedInvoices
    };
};
