import { useAuth } from '@/contexts/auth-context';
import { ChatMessage, sendChatMessage, subscribeConversationMessages } from '@/services/chat-service';
import { getUserProfile } from '@/services/user-service';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ conversationId?: string; peerName?: string; peerId?: string }>();
  const conversationId = typeof params.conversationId === 'string' ? params.conversationId : '';
  const fallbackPeerName = typeof params.peerName === 'string' ? params.peerName : 'Matched User';
  const peerId = typeof params.peerId === 'string' ? params.peerId : '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [peerName, setPeerName] = useState(fallbackPeerName);
  const [peerAvatar, setPeerAvatar] = useState('');
  const [myName, setMyName] = useState('User');
  const [myAvatar, setMyAvatar] = useState('');

  useEffect(() => {
    if (!conversationId) {
      return;
    }
    const unsubscribe = subscribeConversationMessages(conversationId, setMessages);
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    let mounted = true;
    const loadPeer = async () => {
      if (!peerId) {
        return;
      }
      const profile = await getUserProfile(peerId);
      if (!mounted || !profile) {
        return;
      }
      if (profile.name) {
        setPeerName(profile.name);
      }
      if (profile.picture) {
        setPeerAvatar(profile.picture);
      }
    };
    loadPeer();
    return () => {
      mounted = false;
    };
  }, [peerId]);

  useEffect(() => {
    let mounted = true;
    const loadMe = async () => {
      if (!user?.uid) {
        return;
      }
      const profile = await getUserProfile(user.uid);
      if (!mounted) {
        return;
      }
      const fallbackName = user.email?.split('@')[0] || 'User';
      setMyName(profile?.name || fallbackName);
      setMyAvatar(profile?.picture || user.photoURL || '');
    };
    loadMe();
    return () => {
      mounted = false;
    };
  }, [user?.email, user?.photoURL, user?.uid]);

  const sortedMessages = useMemo(() => [...messages], [messages]);
  const formatTime = (message: ChatMessage) => {
    const date = message.createdAt?.toDate?.();
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async () => {
    if (!user?.uid || !conversationId || !messageText.trim()) {
      return;
    }
    await sendChatMessage(conversationId, user.uid, messageText, peerId, myName, myAvatar);
    setMessageText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerUserWrap}>
          <Image
            source={{ uri: peerAvatar || 'https://ui-avatars.com/api/?name=User&background=E5E7EB&color=4B5563&size=128' }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerTitle}>{peerName}</Text>
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.swapButtonContainer}>
        <TouchableOpacity style={styles.swapButton}>
          <Ionicons name="swap-horizontal" size={14} color="#FFFFFF" />
          <Text style={styles.swapButtonText}>Send Swap Request</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayDividerWrap}>
        <View style={styles.dayDivider} />
        <Text style={styles.dayText}>TODAY</Text>
        <View style={styles.dayDivider} />
      </View>

      <FlatList
        data={sortedMessages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.uid;
          return (
            <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
              <View style={{ maxWidth: '78%' }}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextTheirs]}>
                    {item.text}
                  </Text>
                </View>
                <Text style={[styles.timeText, isMine ? styles.timeMine : styles.timeTheirs]}>
                  {formatTime(item)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF1',
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUserWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  onlineText: {
    fontSize: 12,
    color: '#22C55E',
    marginTop: 1,
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#26C6A8',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
  },
  swapButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  dayDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  dayDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dayText: {
    marginHorizontal: 10,
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 12,
  },
  messagesList: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  bubbleMine: {
    backgroundColor: '#66D3B8',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#F2F4F5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  messageTextMine: {
    color: '#FFFFFF',
  },
  messageTextTheirs: {
    color: '#1F2937',
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  timeMine: {
    textAlign: 'right',
    marginRight: 4,
  },
  timeTheirs: {
    textAlign: 'left',
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFF',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1ECE90',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
