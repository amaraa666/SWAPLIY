import app from '@/config/firebase';
import { createNotification } from '@/services/notification-service';
import {
  DocumentData,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where
} from 'firebase/firestore';

const db = getFirestore(app);

export type ProductLocation = {
  latitude: number;
  longitude: number;
};

export interface Product extends DocumentData {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  images: string[];
  sellerId: string;
  sellerEmail: string;
  createdAt: any;
  active: boolean;
  isPublic: boolean;
  likes: string[];
  matches?: string[];
  /** Seller coordinates when posting (used for nearby map). */
  location?: ProductLocation;
}

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('active', '==', true),
      where('isPublic', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('active', '==', true),
      where('category', '==', category)
    );
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
};

export const getUserProducts = async (userId: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching user products:', error);
    return [];
  }
};

export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const ref = doc(db, 'products', productId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return null;
    }
    return { id: snap.id, ...snap.data() } as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

function hasValidProductLocation(product: Product): product is Product & { location: ProductLocation } {
  const loc = product.location;
  return (
    !!loc &&
    typeof loc.latitude === 'number' &&
    typeof loc.longitude === 'number' &&
    !Number.isNaN(loc.latitude) &&
    !Number.isNaN(loc.longitude)
  );
}

export const getProductsNearby = async (
  latitude: number,
  longitude: number,
  radiusInKm: number = 10
): Promise<Product[]> => {
  try {
    const allProducts = await getAllProducts();

    const nearbyProducts = allProducts.filter((product) => {
      if (!hasValidProductLocation(product)) {
        return false;
      }
      const distance = calculateDistance(
        latitude,
        longitude,
        product.location.latitude,
        product.location.longitude
      );
      return distance <= radiusInKm;
    });

    nearbyProducts.sort((a, b) => {
      if (!hasValidProductLocation(a) || !hasValidProductLocation(b)) {
        return 0;
      }
      const da = calculateDistance(latitude, longitude, a.location.latitude, a.location.longitude);
      const db = calculateDistance(latitude, longitude, b.location.latitude, b.location.longitude);
      return da - db;
    });

    return nearbyProducts;
  } catch (error) {
    console.error('Error fetching nearby products:', error);
    return [];
  }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Like and Unlike Functions
export const likeProduct = async (productId: string, userId: string): Promise<{ success: boolean; isMatch: boolean }> => {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      return { success: false, isMatch: false };
    }
    
    const product = productSnap.data() as Product;
    const sellerUserId = product.sellerId;

    // Prevent liking and matching your own product.
    if (sellerUserId === userId) {
      return { success: false, isMatch: false };
    }

    const wasAlreadyLiked = Array.isArray(product.likes) && product.likes.includes(userId);

    const likerUserRef = doc(db, 'users', userId);
    const likerSnapshot = await getDoc(likerUserRef);
    const likerProfile = likerSnapshot.exists() ? likerSnapshot.data() : {};
    const actorName =
      (likerProfile.name as string | undefined) ||
      (likerProfile.email as string | undefined)?.split('@')?.[0] ||
      'Someone';
    const actorAvatar = likerProfile.picture as string | undefined;
    
    // Add like
    await updateDoc(productRef, {
      likes: arrayUnion(userId),
    });

    if (!wasAlreadyLiked && sellerUserId !== userId) {
      await createNotification({
        userId: sellerUserId,
        type: 'like',
        actorId: userId,
        actorName,
        actorAvatar,
        productId,
        productName: product.name,
        message: `${actorName} таны "${product.name}" барааг сонирхож лайк дарлаа.`,
      });
    }
    
    // Check for match
    const isMatch = await checkAndCreateMatch(productId, userId, sellerUserId);

    if (isMatch) {
      await createNotification({
        userId: sellerUserId,
        type: 'match',
        actorId: userId,
        actorName,
        actorAvatar,
        productId,
        productName: product.name,
        message: `${actorName}-тай таны солилцоо Match боллоо.`,
      });

      await createNotification({
        userId,
        type: 'match',
        actorId: sellerUserId,
        actorName: product.sellerEmail?.split('@')[0] || 'User',
        productId,
        productName: product.name,
        message: `"${product.name}" бараан дээр Match амжилттай үүслээ.`,
      });
    }
    
    return { success: true, isMatch };
  } catch (error) {
    console.error('Error liking product:', error);
    return { success: false, isMatch: false };
  }
};

export const unlikeProduct = async (productId: string, userId: string): Promise<boolean> => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      likes: arrayRemove(userId),
    });
    return true;
  } catch (error) {
    console.error('Error unliking product:', error);
    return false;
  }
};

export const getLikedProducts = async (userId: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('active', '==', true),
      where('isPublic', '==', true),
      where('likes', 'array-contains', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching liked products:', error);
    return [];
  }
};

export const getMatchedProducts = async (userId: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', userId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const matchedProducts: Product[] = [];
    querySnapshot.forEach((doc) => {
      const product = {
        id: doc.id,
        ...doc.data(),
      } as Product;
      
      // Only include products that have matches
      if (product.matches && product.matches.length > 0) {
        matchedProducts.push(product);
      }
    });
    
    return matchedProducts;
  } catch (error) {
    console.error('Error fetching matched products:', error);
    return [];
  }
};

export const getUserSwapCount = async (userId: string): Promise<number> => {
  try {
    const matchedProducts = await getMatchedProducts(userId);
    return matchedProducts.length;
  } catch (error) {
    console.error('Error fetching user swap count:', error);
    return 0;
  }
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnapshot = await getDoc(productRef);
    if (!productSnapshot.exists()) {
      return false;
    }

    const product = productSnapshot.data() as Product;
    if (Array.isArray(product.matches) && product.matches.length > 0) {
      // Do not allow deleting products that are already matched.
      return false;
    }

    await updateDoc(productRef, {
      active: false,
    });
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

export const checkAndCreateMatch = async (
  productId: string,
  userId: string,
  sellerUserId: string
): Promise<boolean> => {
  try {
    if (userId === sellerUserId) {
      return false;
    }

    // Get the current user's products (the one who just liked).
    const userProducts = await getUserProducts(userId);
    
    // Check if seller has liked any of this user's products.
    for (const userProduct of userProducts) {
      if (
        userProduct.likes &&
        userProduct.likes.includes(sellerUserId)
      ) {
        // Mutual like found! Create a match
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, {
          matches: arrayUnion(userId),
        });
        
        const userProductRef = doc(db, 'products', userProduct.id);
        await updateDoc(userProductRef, {
          matches: arrayUnion(sellerUserId),
        });
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking match:', error);
    return false;
  }
};
