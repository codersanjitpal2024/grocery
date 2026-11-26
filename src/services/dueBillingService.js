import * as dueBillingRepository from '../repository/dueBillingRepository.js';
import Customer from '../model/Customer.js';

export const addDueBilling = async (data) => {
    let { customerId, shopId, amount, fullName, phoneNumber } = data;

    if (!customerId) {
        if (!fullName || !phoneNumber) {
            throw new Error("Either customerId or both fullName and phoneNumber must be provided.");
        }

        // Check if customer already exists with this phone number in this shop
        let customer = await Customer.findOne({ phoneNumber, shopId });

        if (!customer) {
            // Create new customer
            customer = new Customer({
                shopId,
                fullName,
                phoneNumber,
                dueamount: amount
            });
            await customer.save();
        }

        customerId = customer._id;
    }

    // Now update customer's due amount
    const customer = await Customer.findById(customerId);
    if (customer) {
        let currentDue = parseFloat(customer.dueamount || "0");
        customer.dueamount = (currentDue + parseFloat(amount)).toString();
        await customer.save();
    }

    // Create due billing record
    return await dueBillingRepository.create({
        customerId,
        shopId,
        amount
    });
};

export const getDueBillingByShop = async (shopId) => {
    return await dueBillingRepository.findByShopId(shopId);
};

export const getDueBillingByCustomer = async (customerId) => {
    return await dueBillingRepository.findByCustomerId(customerId);
};

export const clearDueBilling = async (data) => {
    let { customerId, shopId, amount } = data;

    if (!customerId || !shopId || amount === undefined) {
        throw new Error("customerId, shopId, and amount must be provided.");
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new Error("Customer not found.");
    }

    let currentDue = parseFloat(customer.dueamount || "0");
    const amountToClear = parseFloat(amount);

    if (amountToClear > currentDue) {
        throw new Error("Amount to clear cannot be greater than the current due amount.");
    }

    customer.dueamount = (currentDue - amountToClear).toString();
    await customer.save();

    return await dueBillingRepository.create({
        customerId,
        shopId,
        amount: amountToClear,
        type: 'CLEAR'
    });
};
