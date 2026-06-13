import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: false
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    area: { type: String, required: true },
    note: { type: String }
  },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      qty: { type: Number, required: true },
      size: { type: String },
      image: { type: String }
    }
  ],
  payment: {
    method: {
      type: String,
      required: true,
      enum: ['cod', 'bkash']
    },
    trxId: {
      type: String,
      required: function() { return this.payment.method === 'bkash'; }
    }
  },
  financials: {
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    grandTotal: { type: Number, required: true }
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
  }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
