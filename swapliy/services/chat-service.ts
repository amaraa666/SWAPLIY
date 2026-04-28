import app from '@/config/firebase';
import { upsertChatNotification } from '@/services/notification-service';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const db = getFirestore(app);

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt?: Timestamp;
}

interface ConversationContext {
  myProductId?: string;
  myProductName?: string;
  theirProductId?: string;
  theirProductName?: string;
}

export const getDirectConversationId = (userA: string, userB: string): string => {
  return [userA, userB].sort().join('_');
};

export const getOrCreateDirectConversation = async (
  userA: string,
  userB: string,
  context?: ConversationContext
): Promise<string> => {
  const conversationId = getDirectConversationId(userA, userB);
  const conversationRef = doc(db, 'conversations', conversationId);
  const snapshot = await getDoc(conversationRef);

  if (!snapshot.exists()) {
    await setDoc(conversationRef, {
      participants: [userA, userB],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      context: context || {},
      lastMessage: '',
      lastMessageAt: null,
    });
  } else if (context) {
    await setDoc(
      conversationRef,
      {
        updatedAt: serverTimestamp(),
        context,
      },
      { merge: true }
    );
  }

  return conversationId;
};

export const sendChatMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  receiverId?: string,
  senderName?: string,
  senderAvatar?: string
): Promise<void> => {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return;
  }

  const conversationRef = doc(db, 'conversations', conversationId);
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');

  await addDoc(messagesRef, {
    senderId,
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    conversationRef,
    {
      lastMessage: trimmedText,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  if (receiverId && receiverId !== senderId) {
    const actorName = senderName || 'User';
    await upsertChatNotification(
      receiverId,
      conversationId,
      senderId,
      actorName,
      senderAvatar,
      `${actorName}: ${trimmedText}`
    );
  }
};

export const subscribeConversationMessages = (
  conversationId: string,
  onChange: (messages: ChatMessage[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ChatMessage, 'id'>),
    }));
    onChange(messages);
  });
};
