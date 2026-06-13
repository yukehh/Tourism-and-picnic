import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  colors: [String],
  images: [String],
  badge: String,
  reviews: [reviewSchema],
  color: {
    type: String,
  },
  image: {
    type: String,
  },
  stock: {
    type: Number,
    default: 10,
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

export default Product;
