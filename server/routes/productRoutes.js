import express from 'express';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products (with optional filtering)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, color, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    
    // Build query object
    const query = {};
    if (category) query.category = category;
    if (color && color !== 'all') query.color = color;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sort configuration
    let sortOptions = { createdAt: -1 }; // newest by default
    if (sort === 'price_asc') sortOptions = { price: 1 };
    else if (sort === 'price_desc') sortOptions = { price: -1 };

    // Pagination configuration
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      products,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      totalProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/products/search
// @desc    Search products by name or category
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    // Case-insensitive regex search
    const regex = new RegExp(q, 'i');
    const products = await Product.find({
      $or: [
        { name: regex },
        { category: regex }
      ]
    });
    
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/products/categories
// @desc    Get all unique product categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories.filter(c => c).sort());
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/products/related/:id
// @desc    Get related products by category
// @access  Public
router.get('/related/:id', async (req, res) => {
  try {
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) return res.status(404).json({ message: 'Product not found' });

    const relatedProducts = await Product.find({
      category: currentProduct.category,
      _id: { $ne: currentProduct._id } // Exclude the current product
    }).limit(4);

    res.json(relatedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, price, category, color, image, stock, description } = req.body;

    const newProduct = new Product({
      name,
      price,
      category,
      color,
      image,
      stock,
      description
    });

    const savedProduct = await newProduct.save();
    
    const io = req.app.get('io');
    if (io) io.emit('productCreated', savedProduct);

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add a review to a product
// @access  Private
router.post('/:id/reviews', requireAuth, async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const userId = req.user.id;
    
    if (!name || !rating || !comment) {
      return res.status(400).json({ message: 'Please provide all review fields' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(r => r.userId === userId);
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = { userId, name, rating: Number(rating), comment };
    product.reviews.push(review);
    
    await product.save();
    res.status(201).json({ message: 'Review added', product });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });

    const io = req.app.get('io');
    if (io) io.emit('productUpdated', updatedProduct);

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const io = req.app.get('io');
    if (io) io.emit('productDeleted', req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
