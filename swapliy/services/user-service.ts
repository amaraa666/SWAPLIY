import app from '@/config/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    setDoc
} from 'firebase/firestore';

const db = getFirestore(app);

export interface UserProfile {
  id: string;
  name?: string;
  phone?: string;
  age?: number;
  picture?: string;
  ratingCount?: number;
  ratingTotal?: number;
  ratingAverage?: number;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) {
      return null;
    }
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, profileData, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const rateUserProfile = async (
  targetUserId: string,
  voterId: string,
  rating: number
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', targetUserId);
    const voteRef = doc(db, 'users', targetUserId, 'ratings', voterId);

    const [userSnapshot, voterSnapshot] = await Promise.all([getDoc(userRef), getDoc(voteRef)]);
    const currentRatingCount = userSnapshot.exists() ? (userSnapshot.data().ratingCount as number | undefined) ?? 0 : 0;
    const currentRatingTotal = userSnapshot.exists() ? (userSnapshot.data().ratingTotal as number | undefined) ?? 0 : 0;
    const previousVote = voterSnapshot.exists() ? (voterSnapshot.data().rating as number | undefined) ?? 0 : 0;
    const isUpdate = voterSnapshot.exists();

    const newRatingCount = isUpdate ? currentRatingCount : currentRatingCount + 1;
    const newRatingTotal = currentRatingTotal - previousVote + rating;
    const newRatingAverage = newRatingCount > 0 ? newRatingTotal / newRatingCount : 0;

    await setDoc(voteRef, { rating }, { merge: true });
    await setDoc(
      userRef,
      {
        ratingCount: newRatingCount,
        ratingTotal: newRatingTotal,
        ratingAverage: newRatingAverage,
      },
      { merge: true }
    );

    return {
      id: targetUserId,
      ...(userSnapshot.exists() ? userSnapshot.data() : {}),
      ratingCount: newRatingCount,
      ratingTotal: newRatingTotal,
      ratingAverage: newRatingAverage,
    } as UserProfile;
  } catch (error) {
    console.error('Error rating user profile:', error);
    return null;
  }
};

export const getUserProfileRatings = async (userId: string): Promise<number> => {
  try {
    const ratingsQuery = collection(db, 'users', userId, 'ratings');
    const snapshot = await getDocs(ratingsQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching profile ratings count:', error);
    return 0;
  }
};

export const getUserVoteByVoter = async (
  targetUserId: string,
  voterId: string
): Promise<number | null> => {
  try {
    const voteRef = doc(db, 'users', targetUserId, 'ratings', voterId);
    const snapshot = await getDoc(voteRef);
    if (!snapshot.exists()) {
      return null;
    }

    return (snapshot.data().rating as number | undefined) ?? null;
  } catch (error) {
    console.error('Error fetching voter rating:', error);
    return null;
  }
};