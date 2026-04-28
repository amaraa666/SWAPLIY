const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://swapliy-default-rtdb.asia-southeast1.firebasedatabase.app',
});

const db = admin.firestore();

// Sample products data
const sampleProducts = [
  {
    name: 'Vintage Denim Jacket',
    price: 45000,
    category: 'clothing',
    description: 'Classic blue denim jacket in excellent condition. Perfect for casual wear. Size M.',
    location: {
      latitude: 47.9,
      longitude: 106.9,
    },
    sellerId: 'admin-user-001',
    sellerEmail: 'seller1@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Denim+Jacket'],
    likes: [],
    createdAt: new Date(),
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
    sellerId: 'admin-user-002',
    sellerEmail: 'seller2@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Headphones'],
    likes: [],
    createdAt: new Date(),
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
    sellerId: 'admin-user-003',
    sellerEmail: 'seller3@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Yoga+Mat'],
    likes: [],
    createdAt: new Date(),
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
    sellerId: 'admin-user-004',
    sellerEmail: 'seller4@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Books'],
    likes: [],
    createdAt: new Date(),
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
    sellerId: 'admin-user-005',
    sellerEmail: 'seller5@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Coffee+Maker'],
    likes: [],
    createdAt: new Date(),
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
    sellerId: 'admin-user-006',
    sellerEmail: 'seller6@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Game+Controller'],
    likes: [],
    createdAt: new Date(),
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
    sellerId: 'admin-user-007',
    sellerEmail: 'seller7@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Running+Shoes'],
    likes: [],
    createdAt: new Date(),
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
    sellerId: 'admin-user-008',
    sellerEmail: 'seller8@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Desk+Lamp'],
    likes: [],
    createdAt: new Date(),
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
    sellerId: 'admin-user-009',
    sellerEmail: 'seller9@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Action+Figures'],
    likes: [],
    createdAt: new Date(),
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
    sellerId: 'admin-user-010',
    sellerEmail: 'seller10@example.com',
    isPublic: true,
    active: true,
    images: ['https://via.placeholder.com/400x300?text=Vintage+Camera'],
    likes: [],
    createdAt: new Date(),
  },
];

async function addSampleProducts() {
  try {
    console.log('Starting to add sample products...');

    for (const product of sampleProducts) {
      const docRef = await db.collection('products').add(product);
      console.log(`✅ Added product: ${product.name} (ID: ${docRef.id})`);
    }

    console.log('\n✨ All sample products added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample products:', error);
    process.exit(1);
  }
}

addSampleProducts();
