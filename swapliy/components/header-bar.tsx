import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/auth-context';
import app from '@/config/firebase';
import { useRouter } from 'expo-router';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';

export default function HeaderBar() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();
  const [profileImageUri, setProfileImageUri] = useState<string>('');
  const DEFAULT_AVATAR_URI = 'https://ui-avatars.com/api/?name=User&background=E5E7EB&color=4B5563&size=128';

  React.useEffect(() => {
    if (!user?.uid) {
      setProfileImageUri('');
      return;
    }

    const db = getFirestore(app);
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = snapshot.data() as { picture?: string } | undefined;
        setProfileImageUri(data?.picture || user.photoURL || '');
      },
      () => {
        setProfileImageUri(user.photoURL || '');
      }
    );

    return unsubscribe;
  }, [user?.uid, user?.photoURL]);

  const handleMenuPress = () => {
    setShowMenu(!showMenu);
    router.push('/filters');
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={handleMenuPress}>
          <Ionicons name="menu" size={28} color="#000   " />
        </TouchableOpacity>
        <Text style={styles.appName}>Swapliy</Text>
      </View>

      <TouchableOpacity style={styles.profileButton}>
        <Image
          source={{
            uri: profileImageUri || DEFAULT_AVATAR_URI,
          }}
          style={styles.profileImage}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E2E2',
  },
});
