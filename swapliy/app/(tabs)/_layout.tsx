import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import HeaderBar from '@/components/header-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import app from '@/config/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { collection, getFirestore, onSnapshot } from 'firebase/firestore';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { user, loading } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const currentRoute = segments[segments.length - 1];
  const shouldShowHeaderBar = currentRoute !== 'chat';

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user?.uid) {
      setAlertCount(0);
      return;
    }

    const db = getFirestore(app);
    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const unsubscribe = onSnapshot(
      notificationsRef,
      (snapshot) => {
        const unreadCount = snapshot.docs.filter((docSnap) => docSnap.data().read !== true).length;
        setAlertCount(unreadCount);
      },
      () => {
        setAlertCount(0);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  return (
    <View style={{ flex: 1 }}>
      {shouldShowHeaderBar && <HeaderBar />}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#1ECE90",
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            height: 88,
            paddingTop: 8,
            paddingBottom: 8,
            paddingHorizontal: 15,
            backgroundColor: "#fff",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarItemStyle: {
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 16,
            marginHorizontal: 4,
            marginVertical: 0,
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarActiveBackgroundColor: '#F0FDF4',
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          
          title: 'Add',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="circle.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.and.waveform" color={color} />,
          tabBarBadge: alertCount > 0 ? alertCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2" color={color} />,
        }}
      />
      <Tabs.Screen
        name="userprofile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="product/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </View>
  );
}
