import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Necessary for cookies (session)
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Make io accessible in routes
app.set('io', io);

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    let currentRoom = null;

    socket.on('joinProductRoom', (productId) => {
        if (currentRoom) {
            socket.leave(currentRoom);
            io.to(currentRoom).emit('viewersCount', io.sockets.adapter.rooms.get(currentRoom)?.size || 0);
        }
        currentRoom = productId;
        socket.join(productId);
        io.to(productId).emit('viewersCount', io.sockets.adapter.rooms.get(productId)?.size || 0);
    });

    socket.on('leaveProductRoom', (productId) => {
        socket.leave(productId);
        if (currentRoom === productId) currentRoom = null;
        io.to(productId).emit('viewersCount', io.sockets.adapter.rooms.get(productId)?.size || 0);
    });

    // Chat Rooms
    socket.on('joinChat', (userId) => {
        socket.join(userId);
    });

    socket.on('joinAdminRoom', () => {
        socket.join('adminRoom');
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (currentRoom) {
            const count = Math.max(0, (io.sockets.adapter.rooms.get(currentRoom)?.size || 1) - 1);
            io.to(currentRoom).emit('viewersCount', count);
        }
    });
});

app.use(express.json());

// Serve Static Uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB using Mongoose
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/warmhut";
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected via Mongoose'))
  .catch(err => console.error('MongoDB connection error:', err));

// Mount Better Auth handler
app.all("/api/auth/*path", toNodeHandler(auth));

// Mount Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/chat", chatRoutes);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Storage Configuration (Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'warmhut_uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif']
  }
});
const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Upload an image
// @access  Public (Should be Admin)
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Construct the full URL for the image (Cloudinary provides it in req.file.path)
  const imageUrl = req.file.path;
  res.json({ imageUrl });
});

// Default route for testing
app.get("/", (req, res) => {
    res.send("Warmhut Backend API is running!");
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
