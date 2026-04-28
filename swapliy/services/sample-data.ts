import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import app from '@/config/firebase';

const db = getFirestore(app);

export const SAMPLE_PRODUCTS = [
  {
    name: 'Vintage Denim Jacket',
    price: 45000,
    category: 'clothing',
    description: 'Classic blue denim jacket in excellent condition. Perfect for casual wear. Size M.',
    location: {
      latitude: 47.9,
      longitude: 106.9,
    },
    images: ['https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=400&h=300&fit=crop'],
  },
  {
    name: 'Wireless Headphones',
    price: 120000,
    category: 'electronics',
    description: 'Noise-cancelling Bluetooth headphones. Barely used, like new condition.',
    location: {
      latitude: 47.92,
      longitude: 106.88,
    },
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'],
  },
  {
    name: 'Yoga Mat & Accessories',
    price: 35000,
    category: 'sports',
    description: 'Non-slip yoga mat with carrying strap. Includes 2 yoga blocks.',
    location: {
      latitude: 47.91,
      longitude: 106.91,
    },
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=300&fit=crop'],
  },
  {
    name: 'Vintage Book Collection',
    price: 25000,
    category: 'books',
    description: 'Set of 5 classic novels. Good condition, some wear on spines.',
    location: {
      latitude: 47.93,
      longitude: 106.87,
    },
    images: ['https://images.unsplash.com/photo-150784272343-583f20270319?w=400&h=300&fit=crop'],
  },
  {
    name: 'Coffee Maker',
    price: 55000,
    category: 'home',
    description: 'Stainless steel coffee maker. Works perfectly, like new.',
    location: {
      latitude: 47.90,
      longitude: 106.92,
    },
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=400&h=300&fit=crop'],
  },
  {
    name: 'Gaming Controller',
    price: 65000,
    category: 'electronics',
    description: 'Wireless gaming controller, compatible with multiple platforms.',
    location: {
      latitude: 47.88,
      longitude: 106.89,
    },
    images: ['https://images.unsplash.com/photo-1538481143081-39872ad9491e?w=400&h=300&fit=crop'],
  },
  {
    name: 'Running Shoes',
    price: 80000,
    category: 'sports',
    description: 'Nike running shoes, size 10. Lightly used, very comfortable.',
    location: {
      latitude: 47.94,
      longitude: 106.86,
    },
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop'],
  },
  {
    name: 'Desk Lamp',
    price: 30000,
    category: 'home',
    description: 'LED desk lamp with adjustable brightness. Perfect for study or work.',
    location: {
      latitude: 47.89,
      longitude: 106.90,
    },
    images: ['https://images.unsplash.com/photo-1565636192335-14c2b7fe46cf?w=400&h=300&fit=crop'],
  },
  {
    name: 'Action Figures Set',
    price: 40000,
    category: 'toys',
    description: 'Limited edition action figures set. Collectible and rare.',
    location: {
      latitude: 47.95,
      longitude: 106.85,
    },
    images: ['https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400&h=300&fit=crop'],
  },
  {
    name: 'Vintage Camera',
    price: 150000,
    category: 'electronics',
    description: 'Film camera from the 1980s. Fully functional and beautiful.',
    location: {
      latitude: 47.87,
      longitude: 106.91,
    },
    images: ['https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=400&h=300&fit=crop'],
  },
  {
    name: 'Leather Backpack',
    price: 75000,
    category: 'clothing',
    description: 'Premium leather backpack, perfect for travel. Lightly used.',
    location: {
      latitude: 47.86,
      longitude: 106.93,
    },
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop'],
  },
  {
    name: 'Bicycle',
    price: 250000,
    category: 'sports',
    description: 'Mountain bike in great condition. Recently serviced.',
    location: {
      latitude: 47.96,
      longitude: 106.84,
    },
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'],
  },
];

export const addSampleProducts = async (userId: string, userEmail: string) => {
  try {
    let addedCount = 0;

    for (const product of SAMPLE_PRODUCTS) {
      await addDoc(collection(db, 'products'), {
        ...product,
        sellerId: userId,
        sellerEmail: userEmail,
        isPublic: true,
        active: true,
        likes: [],
        createdAt: serverTimestamp(),
      });
      addedCount++;
    }

    return {
      success: true,
      message: `✅ Successfully added ${addedCount} sample products!`,
      count: addedCount,
    };
  } catch (error) {
    console.error('Error adding sample products:', error);
    return {
      success: false,
      message: '❌ Failed to add sample products',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
