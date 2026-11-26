import mongoose from 'mongoose';
const customerSchema = new mongoose.Schema({
    shopId: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    dueamount: {
        type: String
    },
    phoneNumber: {
        type: String,
    }

}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
