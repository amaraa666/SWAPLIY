import app from '@/config/firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

const db = getFirestore(app);

export type NotificationType = 'like' | 'match' | 'chat';

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  productId?: string;
  productName?: string;
  message: string;
  read?: boolean;
  readAt?: Timestamp;
  createdAt?: Timestamp;
}

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  productId?: string;
  productName?: string;
  message: string;
}

export const createNotification = async (payload: CreateNotificationInput): Promise<void> => {
  try {
    await addDoc(collection(db, 'users', payload.userId, 'notifications'), {
      ...payload,
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const snapshot = await getDocs(notificationsRef);
    if (snapshot.empty) {
      return;
    }

    const docsToUpdate = snapshot.docs.filter((docSnap) => docSnap.data().read !== true);
    if (docsToUpdate.length === 0) {
      return;
    }

    for (let i = 0; i < docsToUpdate.length; i += 400) {
      const chunk = docsToUpdate.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          read: true,
          readAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
};

export const upsertChatNotification = async (
  receiverUserId: string,
  conversationId: string,
  actorId: string,
  actorName: string,
  actorAvatar: string | undefined,
  message: string
): Promise<void> => {
  try {
    const notificationId = `chat_${conversationId}`;
    const notificationRef = doc(db, 'users', receiverUserId, 'notifications', notificationId);

    await setDoc(
      notificationRef,
      {
        userId: receiverUserId,
        type: 'chat',
        actorId,
        actorName,
        actorAvatar: actorAvatar || null,
        message,
        read: false,
        readAt: null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error upserting chat notification:', error);
  }
};

export const getLatestNotifications = async (userId: string, maxCount: number = 20): Promise<UserNotification[]> => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);

    const notifications: UserNotification[] = [];
    snapshot.forEach((docSnap) => {
      notifications.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as UserNotification);
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};
