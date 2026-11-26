import mongoose from 'mongoose';

const dueBillingSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true
    },
    shopId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['ADD', 'CLEAR'],
        default: 'ADD'
    }
}, { timestamps: true });

const DueBilling = mongoose.model('DueBilling', dueBillingSchema);

export default DueBilling;
