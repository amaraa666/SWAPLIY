import React, { useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/auth-context';
import app from '@/config/firebase';
import { useRouter } from 'expo-router';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';

export default function HeaderBar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
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
    router.push('/filters');
  };

  const handleLogout = async () => {
    try {
      setShowProfileModal(false);
      await logout();
      router.replace('/onboarding');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout failed', 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={handleMenuPress}>
          <Ionicons name="menu" size={28} color="#000   " />
        </TouchableOpacity>
        <Text style={styles.appName}>Swapliy</Text>
      </View>

      <TouchableOpacity style={styles.profileButton} onPress={() => setShowProfileModal(true)}>
        <Image
          source={{
            uri: profileImageUri || DEFAULT_AVATAR_URI,
          }}
          style={styles.profileImage}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={showProfileModal}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalAction} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: 12,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    paddingVertical: 6,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
});
