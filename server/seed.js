import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/warmhut";

const seedProducts = [
  // Caps
  { name: "Lyle & Scott Cap (Jet Black)", price: 350, category: "Caps", color: "black", image: "/assets/Caps/BASEBALL UNISEX - Cap - jet black.webp", stock: 20 },
  { name: "Lyle & Scott Cap (Deep Depths)", price: 350, category: "Caps", color: "gray", image: "/assets/Caps/BASEBALL UNISEX - Cap - deep depths.webp", stock: 15 },
  { name: "Lyle & Scott Cap (Espresso)", price: 350, category: "Caps", color: "brown", image: "/assets/Caps/BASEBALL UNISEX - Cap - espresso.webp", stock: 15 },
  { name: "Lyle & Scott Cap (Grey Taupe)", price: 350, category: "Caps", color: "gray", image: "/assets/Caps/BASEBALL UNISEX - Cap - grey taupe.webp", stock: 15 },
  { name: "Lyle & Scott Cap (White)", price: 350, category: "Caps", color: "white", image: "/assets/Caps/white.webp", stock: 15 },
  { name: "Lyle & Scott Cap (Gray Stone)", price: 350, category: "Caps", color: "gray", image: "/assets/Caps/grayStone.webp", stock: 15 },
  { name: "HUF Cap (Stone)", price: 350, category: "Caps", color: "gray", image: "/assets/Caps/Huf stone.webp", stock: 15 },
  { name: "HUF Cap (Black)", price: 350, category: "Caps", color: "black", image: "/assets/Caps/Huf black.webp", stock: 10 },
  { name: "Nike Sportswear Cap (White)", price: 350, category: "Caps", color: "white", image: "/assets/Caps/Nike Sportswear(white).webp", stock: 5 },
  { name: "Puma Cap (Black)", price: 350, category: "Caps", color: "black", image: "/assets/Caps/Puma Black.webp", stock: 15 },
  { name: "Tommy Hilfiger Cap (Universal Gray)", price: 350, category: "Caps", color: "gray", image: "/assets/Caps/Tommy Hilfiger(Universal Gray).webp", stock: 15 },

  // Dropshoulder Hoodie
  { name: "Washed Dropshoulder Hoodie (Blue)", price: 1500, category: "Dropshoulder Hoodie", color: "blue", image: "/assets/DropsholderHoodie/Washed-DropsholderHoodie-blue.jpg", stock: 20 },
  { name: "Washed Dropshoulder Hoodie (Autumn)", price: 1500, category: "Dropshoulder Hoodie", color: "autumn", image: "/assets/DropsholderHoodie/Washed-DropsholderHoodie-Autunm.jpg", stock: 20 },
  { name: "Washed Dropshoulder Hoodie (Gray)", price: 1500, category: "Dropshoulder Hoodie", color: "gray", image: "/assets/DropsholderHoodie/Washed-DropsholderHoodie-gray.jpg", stock: 20 },
  { name: "Washed Dropshoulder Hoodie (Black)", price: 1500, category: "Dropshoulder Hoodie", color: "black", image: "/assets/DropsholderHoodie/Washed-DropsholderHoodie-black.jpg", stock: 20 },

  // Hoodie
  { name: "SUPER Hoodie (Olive)", price: 1400, category: "Hoodie", color: "olive", image: "/assets/Hoodie/SUPER - Hoodie - olive.webp", stock: 25 },
  { name: "SUPER Hoodie (Cream White)", price: 1400, category: "Hoodie", color: "white", image: "/assets/Hoodie/SUPER - Hoodie - creamwhite.webp", stock: 25 },
  { name: "SUPER Hoodie (Black)", price: 1400, category: "Hoodie", color: "black", image: "/assets/Hoodie/SUPER - Hoodie - black.webp", stock: 25 },
  { name: "SUPER Hoodie (Baby Blue)", price: 1400, category: "Hoodie", color: "blue", image: "/assets/Hoodie/SUPER - Hoodie - babyblue.webp", stock: 25 },

  // Shoes
  { name: "Air Force 107 (Black)", price: 2200, category: "Shoes", color: "black", image: "/assets/Shoes/AIR FORCE 1 07 - Trainers - black.webp", stock: 10 },
  { name: "Air Monarch IV Training Shoe", price: 2300, category: "Shoes", color: "white", image: "/assets/Shoes/AIR MONARCH IV - Training shoe.webp", stock: 10 },
  { name: "Run Four Trainers", price: 2100, category: "Shoes", color: "brown", image: "/assets/Shoes/RUN FOUR - Trainers.webp", stock: 10 },
  { name: "Superstar II Trainers", price: 2500, category: "Shoes", color: "white", image: "/assets/Shoes/SUPERSTAR II  - Trainers.webp", stock: 10 },

  // Sweatshirts
  { name: "Jack & Jones Sweatshirt", price: 750, category: "Sweatshirt", color: "white", image: "/assets/Sweetshirt/Jack & Jonys -Sweet Shirt.webp", stock: 30 },
  { name: "Sweatshirt (Black)", price: 650, category: "Sweatshirt", color: "black", image: "/assets/Sweetshirt/Sweet Shirt -Black.webp", stock: 30 },
  { name: "Sweatshirt (Gray)", price: 650, category: "Sweatshirt", color: "gray", image: "/assets/Sweetshirt/Sweet Shirt -Gray.webp", stock: 30 },
  { name: "Sweatshirt (Light Gray)", price: 650, category: "Sweatshirt", color: "gray", image: "/assets/Sweetshirt/Sweet Shirt -Light Gray.webp", stock: 30 },

  // Wallets
  { name: "Eton & Coin Set Wallet (Black)", price: 450, category: "Wallet", color: "black", image: "/assets/Wallet/ETON AND COIN SET - Wallet - black.webp", stock: 40 },
  { name: "IGOR Wallet (Black)", price: 500, category: "Wallet", color: "black", image: "/assets/Wallet/IGOR - Wallet - black.webp", stock: 40 },
  { name: "RE-LOCK Large Zip Around (Black)", price: 550, category: "Wallet", color: "black", image: "/assets/Wallet/RE-LOCK LARGE ZIP AROUND - Wallet - black.webp", stock: 40 },
  { name: "TIMILUS Wallet (Black)", price: 400, category: "Wallet", color: "black", image: "/assets/Wallet/TIMILUS - Wallet - black.webp", stock: 40 },
  { name: "Quiksilver Wallet (Brown)", price: 400, category: "Wallet", color: "brown", image: "/assets/Wallet/Quiksilver -Brown.webp", stock: 40 },
  { name: "Anna Field Wallet (Brown)", price: 400, category: "Wallet", color: "brown", image: "/assets/Wallet/Anna Field -Brown.webp", stock: 40 },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing products so we don't have duplicates
    await Product.deleteMany({});
    console.log('Cleared existing products');

    await Product.insertMany(seedProducts);
    console.log('Successfully seeded database with all products!');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
