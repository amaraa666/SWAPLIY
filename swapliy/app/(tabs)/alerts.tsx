import { useAuth } from '@/contexts/auth-context';
import { getOrCreateDirectConversation } from '@/services/chat-service';
import {
  getLatestNotifications,
  markAllNotificationsAsRead,
  UserNotification
} from '@/services/notification-service';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AlertsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const latest = await getLatestNotifications(user.uid, 20);
      setNotifications(latest);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      const markAndLoad = async () => {
        if (user?.uid) {
          await markAllNotificationsAsRead(user.uid);
        }
        await loadNotifications();
      };

      markAndLoad();
    }, [loadNotifications, user?.uid])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const getActionText = (item: UserNotification) => {
    if (item.type === 'match') return 'Chat бичих';
    if (item.type === 'chat') return 'Message ирсэн';
    return 'Дэлгэрэнгүй';
  };

  const getTypeLabel = (item: UserNotification) => {
    if (item.type === 'match') return 'MATCH';
    if (item.type === 'chat') return 'CHAT';
    return 'ALERT';
  };

  const getTypeIcon = (item: UserNotification) => {
    if (item.type === 'match') return 'favorite';
    if (item.type === 'chat') return 'chat-bubble';
    return 'notifications';
  };

  const getTimeLabel = (item: UserNotification) => {
    const date = item.createdAt?.toDate?.();
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNotificationPress = async (item: UserNotification) => {
    if (!user?.uid) {
      return;
    }

    if (item.type === 'match' || item.type === 'chat') {
      const conversationId =
        item.type === 'chat' && item.id.startsWith('chat_')
          ? item.id.replace('chat_', '')
          : await getOrCreateDirectConversation(user.uid, item.actorId);

      router.push({
        pathname: '/(tabs)/chat',
        params: {
          conversationId,
          peerId: item.actorId,
          peerName: item.actorName || 'Matched User',
        },
      });
    }
  };

  const renderNotification = ({ item }: { item: UserNotification }) => (
    <TouchableOpacity
      style={[styles.notificationRow, item.read ? styles.notificationRowRead : styles.notificationRowUnread]}
      activeOpacity={0.85}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.avatarWrap}>
        {item.actorAvatar ? (
          <Image source={{ uri: item.actorAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialIcons name="person" size={18} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.textWrap}>
        <View style={styles.metaRow}>
          <View style={styles.typePill}>
            <MaterialIcons name={getTypeIcon(item)} size={12} color="#0EA5E9" />
            <Text style={styles.typePillText}>{getTypeLabel(item)}</Text>
          </View>
          <Text style={styles.timeText}>{getTimeLabel(item)}</Text>
        </View>
        <Text style={[styles.mainText, item.read && styles.mainTextRead]}>{item.message}</Text>
        <Text style={[styles.subText, item.read && styles.subTextRead]}>Танд шинэ activity бүртгэгдлээ.</Text>
        <Text style={styles.actionText}>{getActionText(item)} ↗</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мэдэгдэл</Text>
      <Text style={styles.subtitle}>Keep track of your trades and community activity.</Text>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#1ECE90" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="notifications-none" size={46} color="#D1D5DB" />
              <Text style={styles.emptyText}>Одоогоор мэдэгдэл алга байна.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 18,
  },
  listContent: {
    paddingBottom: 120,
    gap: 12,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationRowUnread: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  notificationRowRead: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  avatarWrap: {
    width: 56,
    height: 56,
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  textWrap: {
    flex: 1,
    paddingTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.4,
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  mainText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '700',
    lineHeight: 20,
  },
  mainTextRead: {
    color: '#374151',
    fontWeight: '500',
  },
  subText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  subTextRead: {
    color: '#4B5563',
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#10B981',
    fontWeight: '800',
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 14,
  },
});
