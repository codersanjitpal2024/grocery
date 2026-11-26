import DueBilling from '../model/DueBilling.js';

export const create = async (data) => {
    const dueBilling = new DueBilling(data);
    return await dueBilling.save();
};

export const findByShopId = async (shopId) => {
    return await DueBilling.find({ shopId });
};

export const findByCustomerId = async (customerId) => {
    return await DueBilling.find({ customerId });
};
