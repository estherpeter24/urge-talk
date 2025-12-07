import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Image,
  PanResponder,
  Linking,
  ScrollView,
  Clipboard,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Geolocation from '@react-native-community/geolocation';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Contacts from 'react-native-contacts';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { ChatStackParamList, Message, Conversation, SocketEvent } from '../../types';
import { Theme } from '../../constants/theme';
import { conversationService, messageService, mediaService } from '../../services/api';
import AttachmentModal from '../../components/chat/AttachmentModal';
import DocumentMenuModal from '../../components/chat/DocumentMenuModal';
import LocationModal from '../../components/chat/LocationModal';
import ContactPickerModal, { Contact } from '../../components/chat/ContactPickerModal';
import MessageInfoModal from '../../components/chat/MessageInfoModal';
import ForwardModal from '../../components/chat/ForwardModal';
import DeleteMessageModal from '../../components/chat/DeleteMessageModal';

const POPULAR_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
  '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
  '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
  '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦',
  '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
  '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿',
  '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
  '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
  '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
  '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '🦻', '👃',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
  '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
  '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
  '🔥', '💧', '💦', '💨', '✨', '🌟', '⭐', '🌠', '🌈', '☀️',
  '🌤', '⛅', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩', '🌨', '❄️',
];

type Props = NativeStackScreenProps<ChatStackParamList, 'ChatRoom'>;

const ChatRoomScreen = ({ route, navigation }: Props) => {
  const { conversationId, recipientName } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const socket = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientStatus, setRecipientStatus] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showDocumentMenu, setShowDocumentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [deviceContacts, setDeviceContacts] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [starredMessages, setStarredMessages] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [selectedForwardChats, setSelectedForwardChats] = useState<string[]>([]);
  const [availableChats, setAvailableChats] = useState<Conversation[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [showMessageInfoModal, setShowMessageInfoModal] = useState(false);
  const [messageForInfo, setMessageForInfo] = useState<Message | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);

  // Audio playback states
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const [audioDuration, setAudioDuration] = useState<{ [key: string]: number }>({});

  const flatListRef = useRef<FlatList>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const recordingPath = useRef<string>('');
  const waveformAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  ).current;

  // Load device contacts function
  const loadDeviceContacts = async () => {
    try {
      // Request contacts permission
      const permission = Platform.OS === 'ios'
        ? await Contacts.requestPermission()
        : await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
            {
              title: 'Contacts Permission',
              message: 'URGE needs access to your contacts to share them',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

      if (permission === 'authorized' || permission === PermissionsAndroid.RESULTS.GRANTED) {
        // Get all contacts
        const contacts = await Contacts.getAll();

        // Format contacts to match our interface
        const formattedContacts = contacts
          .filter(contact => contact.phoneNumbers.length > 0)
          .map(contact => ({
            id: contact.recordID,
            name: contact.displayName || `${contact.givenName || ''} ${contact.familyName || ''}`.trim() || 'Unknown',
            phone: contact.phoneNumbers[0]?.number || '',
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setDeviceContacts(formattedContacts);
      } else {
        Alert.alert(
          'Permission Required',
          'Please allow contacts access to share contacts',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    }
  };

  // Load messages when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadMessages();
      markConversationAsRead();
    }, [conversationId])
  );

  useEffect(() => {
    loadAvailableChats();
  }, []);

  // Socket.IO real-time messaging
  useEffect(() => {
    // Join conversation room
    socket.joinConversation(conversationId);

    // Handle new message received
    const handleMessageReceived = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
        // Mark as read if we're viewing the conversation
        socket.markMessageRead(message.id, conversationId);
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    // Handle message delivered status
    const handleMessageDelivered = (messageId: string) => {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, status: 'DELIVERED' } : msg
      ));
    };

    // Handle message read status
    const handleMessageRead = (data: { messageId: string; userId: string }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, status: 'READ' } : msg
      ));
    };

    // Handle typing indicators
    const handleTypingStart = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        // Show typing indicator (can add state for this)
        console.log('User is typing:', data.userId);
      }
    };

    const handleTypingStop = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        // Hide typing indicator
        console.log('User stopped typing:', data.userId);
      }
    };

    // Handle user online/offline status
    const handleUserOnline = (userId: string) => {
      // Update recipient status if it's the other user in conversation
      console.log('User online:', userId);
      setRecipientStatus('online');
    };

    const handleUserOffline = (userId: string) => {
      // Update recipient status if it's the other user in conversation
      console.log('User offline:', userId);
      setRecipientStatus('offline');
    };

    // Register event listeners
    socket.addEventListener(SocketEvent.MESSAGE_RECEIVED, handleMessageReceived);
    socket.addEventListener(SocketEvent.MESSAGE_DELIVERED, handleMessageDelivered);
    socket.addEventListener(SocketEvent.MESSAGE_READ, handleMessageRead);
    socket.addEventListener(SocketEvent.TYPING_START, handleTypingStart);
    socket.addEventListener(SocketEvent.TYPING_STOP, handleTypingStop);
    socket.addEventListener(SocketEvent.USER_ONLINE, handleUserOnline);
    socket.addEventListener(SocketEvent.USER_OFFLINE, handleUserOffline);

    // Cleanup on unmount
    return () => {
      socket.leaveConversation(conversationId);
      socket.removeEventListener(SocketEvent.MESSAGE_RECEIVED, handleMessageReceived);
      socket.removeEventListener(SocketEvent.MESSAGE_DELIVERED, handleMessageDelivered);
      socket.removeEventListener(SocketEvent.MESSAGE_READ, handleMessageRead);
      socket.removeEventListener(SocketEvent.TYPING_START, handleTypingStart);
      socket.removeEventListener(SocketEvent.TYPING_STOP, handleTypingStop);
      socket.removeEventListener(SocketEvent.USER_ONLINE, handleUserOnline);
      socket.removeEventListener(SocketEvent.USER_OFFLINE, handleUserOffline);
    };
  }, [conversationId, socket, user?.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await conversationService.getMessages(conversationId, 100, 0);

      if (response.success && response.data) {
        // Convert API messages to Message format
        const formattedMessages: Message[] = response.data.messages.map((msg: any) => ({
          id: msg.id,
          conversationId: msg.conversationId || msg.conversation_id,
          senderId: msg.senderId || msg.sender_id,
          senderName: msg.senderName || msg.sender_name || 'Unknown',
          content: msg.content || '',
          type: msg.messageType || msg.message_type || 'TEXT',
          status: msg.status || 'SENT',
          isEncrypted: msg.isEncrypted || msg.is_encrypted || false,
          createdAt: new Date(msg.createdAt || msg.created_at),
          updatedAt: new Date(msg.updatedAt || msg.updated_at),
          mediaUrl: msg.mediaUrl || msg.media_url,
          replyTo: msg.replyTo || msg.reply_to ? {
            id: (msg.replyTo || msg.reply_to).id,
            senderName: (msg.replyTo || msg.reply_to).senderName || (msg.replyTo || msg.reply_to).sender_name,
            content: (msg.replyTo || msg.reply_to).content || 'Media',
          } : undefined,
        }));

        setMessages(formattedMessages);
      } else {
        Alert.alert('Error', response.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Load messages error:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markConversationAsRead = async () => {
    try {
      await conversationService.markAsRead(conversationId);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const loadAvailableChats = async () => {
    try {
      const response = await conversationService.getConversations(50, 0);
      if (response.success && response.data) {
        const formattedConversations: Conversation[] = response.data.conversations
          .filter((conv: any) => conv.id !== conversationId)
          .map((conv: any) => ({
            id: conv.id,
            name: conv.name || 'Unknown',
            avatar: conv.avatar_url,
            lastMessage: {
              content: conv.last_message?.content || '',
              createdAt: conv.last_message?.created_at || new Date().toISOString(),
            },
            unreadCount: conv.unread_count || 0,
            isTyping: false,
          }));
        setAvailableChats(formattedConversations);
      }
    } catch (error) {
      console.error('Load chats error:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderId: user?.id || 'current',
      senderName: user?.displayName || 'You',
      content: inputText.trim(),
      type: 'TEXT',
      status: 'SENDING',
      isEncrypted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content || 'Media',
      } : undefined,
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    const messageContent = inputText.trim();
    setInputText('');
    setReplyingTo(null);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await messageService.sendMessage({
        conversation_id: conversationId,
        content: messageContent,
        message_type: 'TEXT',
        reply_to_id: replyingTo?.id,
      });

      if (response.success && response.data) {
        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? {
            ...msg,
            id: response.data!.id,
            status: 'SENT',
            createdAt: new Date(response.data!.created_at),
            updatedAt: new Date(response.data!.updated_at),
          } : msg
        ));
      } else {
        // Mark message as failed
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? { ...msg, status: 'FAILED' } : msg
        ));
        Alert.alert('Error', response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, status: 'FAILED' } : msg
      ));
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleAttachment = () => {
    setShowAttachmentMenu(true);
  };

  const closeAttachmentMenu = () => {
    setShowAttachmentMenu(false);
  };

  const handleAttachmentOption = (type: string) => {
    closeAttachmentMenu();
    setTimeout(() => {
      switch (type) {
        case 'camera':
          handleCameraCapture();
          break;
        case 'gallery':
          handleGalleryPicker();
          break;
        case 'document':
          handleDocumentPicker();
          break;
        case 'location':
          handleLocationShare();
          break;
        case 'contact':
          handleContactPicker();
          break;
      }
    }, 300);
  };

  const uploadMediaFile = async (file: any): Promise<string | null> => {
    try {
      setUploadingMedia(true);
      const response = await mediaService.uploadMedia(file, (progress) => {
        setUploadProgress(progress);
      });

      return response.file_url;
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload media');
      return null;
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  const sendMediaMessage = async (mediaUrl: string, type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT', content?: string) => {
    console.log(`[sendMediaMessage] Starting - type: ${type}, mediaUrl: ${mediaUrl}, conversationId: ${conversationId}`);
    try {
      console.log(`[sendMediaMessage] Calling messageService.sendMessage...`);
      const response = await messageService.sendMessage({
        conversation_id: conversationId,
        content: content || '',
        message_type: type,
        media_url: mediaUrl,
      });

      console.log(`📸 ${type} message response:`, JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        const newMessage: Message = {
          id: response.data.id,
          conversationId: response.data.conversationId || response.data.conversation_id,
          senderId: response.data.senderId || response.data.sender_id,
          senderName: response.data.senderName || response.data.sender_name || 'You',
          content: response.data.content || '',
          type: response.data.messageType || response.data.message_type,
          status: response.data.status,
          isEncrypted: response.data.isEncrypted || response.data.is_encrypted || false,
          mediaUrl: response.data.mediaUrl || response.data.media_url,
          createdAt: new Date(response.data.createdAt || response.data.created_at),
          updatedAt: new Date(response.data.updatedAt || response.data.updated_at),
        };
        console.log(`📸 Created ${type} message:`, JSON.stringify(newMessage, null, 2));
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log(`[sendMediaMessage] Response not successful or no data:`, response);
      }
    } catch (error) {
      console.error('[sendMediaMessage] ERROR:', error);
      Alert.alert('Error', 'Failed to send media message');
    }
  };

  const handleCameraCapture = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'mixed',
        saveToPhotos: true,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type?.includes('video');

        const mediaUrl = await uploadMediaFile({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'capture.jpg',
        });

        if (mediaUrl) {
          await sendMediaMessage(mediaUrl, isVideo ? 'VIDEO' : 'IMAGE');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleGalleryPicker = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 10,
      });

      if (result.assets) {
        for (const asset of result.assets) {
          const isVideo = asset.type?.includes('video');
          const mediaUrl = await uploadMediaFile({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'image.jpg',
          });

          if (mediaUrl) {
            await sendMediaMessage(mediaUrl, isVideo ? 'VIDEO' : 'IMAGE');
          }
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleDocumentPicker = () => {
    setShowDocumentMenu(true);
  };

  const closeDocumentMenu = () => {
    setShowDocumentMenu(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const handleDocumentType = async (type: 'document' | 'gallery' | 'camera') => {
    closeDocumentMenu();

    setTimeout(async () => {
      try {
        if (type === 'document') {
          const result = await DocumentPicker.pick({
            type: [DocumentPicker.types.allFiles],
            allowMultiSelection: false,
          });

          if (result[0]) {
            const doc = result[0];
            const mediaUrl = await uploadMediaFile({
              uri: doc.uri,
              type: doc.type || 'application/octet-stream',
              name: doc.name || 'document',
            });

            if (mediaUrl) {
              const sizeInKB = doc.size ? Math.round(doc.size / 1024) : 0;
              const sizeInMB = doc.size ? (doc.size / 1024 / 1024).toFixed(1) : '0.0';
              const displaySize = sizeInKB < 1024 ? `${sizeInKB} KB` : `${sizeInMB} MB`;

              await sendMediaMessage(
                mediaUrl,
                'DOCUMENT',
                JSON.stringify({
                  name: doc.name,
                  size: displaySize,
                  type: doc.type || 'application/octet-stream',
                })
              );
            }
          }
        } else if (type === 'gallery') {
          handleGalleryPicker();
        } else if (type === 'camera') {
          handleCameraCapture();
        }
      } catch (err) {
        if (DocumentPicker.isCancel(err)) {
          console.log('User cancelled document picker');
        } else {
          console.error('Document picker error:', err);
          Alert.alert('Error', 'Failed to pick document');
        }
      }
    }, 300);
  };

  const handleLocationShare = async () => {
    closeAttachmentMenu();

    setTimeout(() => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          setShowLocationModal(true);
        },
        (error) => {
          console.error('Location error:', error);
          Alert.alert('Error', 'Could not get your location. Please check your location settings.');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    }, 300);
  };

  const sendLocation = async (isLive: boolean) => {
    if (!currentLocation) return;

    const locationData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      isLive,
    };

    try {
      const response = await messageService.sendMessage({
        conversation_id: conversationId,
        content: JSON.stringify(locationData),
        message_type: 'LOCATION',
      });

      if (response.success && response.data) {
        const newMessage: Message = {
          id: response.data.id,
          conversationId: response.data.conversation_id,
          senderId: response.data.sender_id,
          senderName: response.data.sender_name || 'You',
          content: response.data.content,
          type: 'LOCATION',
          status: response.data.status,
          isEncrypted: response.data.is_encrypted || false,
          createdAt: new Date(response.data.created_at),
          updatedAt: new Date(response.data.updated_at),
        };

        setMessages(prev => [...prev, newMessage]);
        setShowLocationModal(false);
        setCurrentLocation(null);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Send location error:', error);
      Alert.alert('Error', 'Failed to send location');
    }
  };

  const openInGoogleMaps = (latitude: number, longitude: number) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      });
    }
  };

  const handleContactPicker = async () => {
    closeAttachmentMenu();
    await loadDeviceContacts();
    setTimeout(() => {
      setShowContactModal(true);
    }, 300);
  };

  const toggleContactSelection = (contact: any) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  const sendContacts = async () => {
    console.log(`[sendContacts] Starting - selectedContacts count: ${selectedContacts.length}, conversationId: ${conversationId}`);
    if (selectedContacts.length === 0) return;

    for (const contact of selectedContacts) {
      try {
        console.log(`[sendContacts] Sending contact:`, contact);
        const response = await messageService.sendMessage({
          conversation_id: conversationId,
          content: JSON.stringify({
            name: contact.name,
            phone: contact.phone,
          }),
          message_type: 'CONTACT',
        });

        console.log('📧 Contact message response:', JSON.stringify(response, null, 2));

        if (response.success && response.data) {
          const newMessage: Message = {
            id: response.data.id,
            conversationId: response.data.conversationId || response.data.conversation_id,
            senderId: response.data.senderId || response.data.sender_id,
            senderName: response.data.senderName || response.data.sender_name || 'You',
            content: response.data.content,
            type: 'CONTACT',
            status: response.data.status,
            isEncrypted: response.data.isEncrypted || response.data.is_encrypted || false,
            createdAt: new Date(response.data.createdAt || response.data.created_at),
            updatedAt: new Date(response.data.updatedAt || response.data.updated_at),
          };
          console.log('📧 Created contact message:', JSON.stringify(newMessage, null, 2));
          setMessages(prev => [...prev, newMessage]);
        } else {
          console.log(`[sendContacts] Response not successful or no data:`, response);
        }
      } catch (error) {
        console.error('[sendContacts] ERROR:', error);
      }
    }

    setShowContactModal(false);
    setSelectedContacts([]);
    setContactSearch('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const filteredContacts = deviceContacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.phone.includes(contactSearch)
  );

  // Message Action Handlers
  const handleLongPressMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageActions(true);
  };

  const handleReply = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
      setShowMessageActions(false);
      setSelectedMessage(null);
    }
  };

  const handleForward = () => {
    if (selectedMessage) {
      setShowMessageActions(false);
      setShowForwardModal(true);
    }
  };

  const toggleForwardChatSelection = (chatId: string) => {
    setSelectedForwardChats(prev => {
      if (prev.includes(chatId)) {
        return prev.filter(id => id !== chatId);
      } else {
        return [...prev, chatId];
      }
    });
  };

  const confirmForward = async () => {
    if (selectedForwardChats.length > 0 && selectedMessage) {
      try {
        const response = await messageService.forwardMessages({
          message_ids: [selectedMessage.id],
          target_conversation_ids: selectedForwardChats,
        });

        if (response.success) {
          showToastNotification(`Message forwarded to ${selectedForwardChats.length} chat${selectedForwardChats.length > 1 ? 's' : ''}`);
        } else {
          Alert.alert('Error', response.message || 'Failed to forward message');
        }
      } catch (error) {
        console.error('Forward error:', error);
        Alert.alert('Error', 'Failed to forward message');
      }

      setShowForwardModal(false);
      setSelectedForwardChats([]);
      setForwardSearchQuery('');
      setSelectedMessage(null);
    }
  };

  const cancelForward = () => {
    setShowForwardModal(false);
    setSelectedForwardChats([]);
    setForwardSearchQuery('');
    setSelectedMessage(null);
  };

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const handleCopy = () => {
    if (selectedMessage && selectedMessage.content) {
      Clipboard.setString(selectedMessage.content);
      setShowMessageActions(false);
      setSelectedMessage(null);
      showToastNotification('Message copied');
    }
  };

  const handleDelete = () => {
    if (selectedMessage) {
      setShowMessageActions(false);
      setMessageToDelete(selectedMessage);
      setShowDeleteModal(true);
    }
  };

  const deleteForMe = async () => {
    if (messageToDelete) {
      try {
        const response = await messageService.deleteMessage(messageToDelete.id, false);

        if (response.success) {
          setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
          showToastNotification('Message deleted');
        } else {
          Alert.alert('Error', response.message || 'Failed to delete message');
        }
      } catch (error) {
        console.error('Delete error:', error);
        Alert.alert('Error', 'Failed to delete message');
      }

      setShowDeleteModal(false);
      setMessageToDelete(null);
      setSelectedMessage(null);
    }
  };

  const deleteForEveryone = async () => {
    if (messageToDelete) {
      try {
        const response = await messageService.deleteMessage(messageToDelete.id, true);

        if (response.success) {
          setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
          showToastNotification('Message deleted for everyone');
        } else {
          Alert.alert('Error', response.message || 'Failed to delete message');
        }
      } catch (error) {
        console.error('Delete error:', error);
        Alert.alert('Error', 'Failed to delete message');
      }

      setShowDeleteModal(false);
      setMessageToDelete(null);
      setSelectedMessage(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMessageToDelete(null);
    setSelectedMessage(null);
  };

  const handleStar = async () => {
    if (selectedMessage) {
      setShowMessageActions(false);
      const newStarred = new Set(starredMessages);
      const isStarred = newStarred.has(selectedMessage.id);

      try {
        const response = await messageService.starMessage(selectedMessage.id, !isStarred);

        if (response.success) {
          if (isStarred) {
            newStarred.delete(selectedMessage.id);
            showToastNotification('Message unstarred');
          } else {
            newStarred.add(selectedMessage.id);
            showToastNotification('Message starred');
          }
          setStarredMessages(newStarred);
        } else {
          Alert.alert('Error', response.message || 'Failed to star message');
        }
      } catch (error) {
        console.error('Star error:', error);
        Alert.alert('Error', 'Failed to star message');
      }

      setSelectedMessage(null);
    }
  };

  const handleMessageInfo = () => {
    if (selectedMessage) {
      setShowMessageActions(false);
      setMessageForInfo(selectedMessage);
      setShowMessageInfoModal(true);
      setSelectedMessage(null);
    }
  };

  const closeMessageInfo = () => {
    setShowMessageInfoModal(false);
    setMessageForInfo(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleChatMenu = async () => {
    Alert.alert(
      'Chat Options',
      'Choose an action',
      [
        {
          text: 'View Contact',
          onPress: () => Alert.alert('Contact Info', `Name: ${recipientName}\nPhone: ${recipientPhone}`),
        },
        {
          text: 'Search Messages',
          onPress: () => Alert.alert('Search', 'Search through messages in this chat'),
        },
        {
          text: 'Mute Notifications',
          onPress: async () => {
            try {
              const response = await conversationService.muteConversation(conversationId, 24);
              if (response.success) {
                Alert.alert('Muted', 'Notifications muted for this chat');
              }
            } catch (error) {
              console.error('Mute error:', error);
            }
          },
        },
        {
          text: 'Clear Chat',
          onPress: () => Alert.alert('Clear Chat', 'Are you sure you want to clear all messages?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear',
              style: 'destructive',
              onPress: async () => {
                try {
                  const response = await conversationService.clearHistory(conversationId);
                  if (response.success) {
                    setMessages([]);
                  }
                } catch (error) {
                  console.error('Clear error:', error);
                }
              }
            },
          ]),
        },
        {
          text: 'Block User',
          onPress: () => Alert.alert('Block', `Block ${recipientName}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Block', style: 'destructive' },
          ]),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Voice recording functions
  const startWaveformAnimation = () => {
    waveformAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300 + index * 100,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 300 + index * 100,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const stopWaveformAnimation = () => {
    waveformAnims.forEach((anim) => {
      anim.stopAnimation();
      anim.setValue(0.3);
    });
  };

  const requestAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'URGE needs access to your microphone to record voice messages',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission request error:', err);
        return false;
      }
    }
    // iOS permissions are requested automatically by the library
    return true;
  };

  const startRecording = async () => {
    console.log('startRecording called');

    try {
      // Request permission first
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please allow microphone access to record voice messages',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // Start audio recording
      const path = Platform.select({
        ios: 'voice_message.m4a',
        android: `${Platform.select({ android: '/sdcard' })}/voice_message.mp4`,
      });

      const result = await audioRecorderPlayer.startRecorder(path);
      recordingPath.current = result;
      console.log('Recording started at:', result);

      // Update UI state
      setIsRecording(true);
      setRecordingTime(0);
      setIsRecordingLocked(false);
      setSlidePosition(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Update recording duration in real-time
      audioRecorderPlayer.addRecordBackListener((e) => {
        if (e.currentPosition) {
          const seconds = Math.floor(e.currentPosition / 1000);
          setRecordingTime(seconds);
        }
      });

      startWaveformAnimation();
      console.log('Recording started, isRecording set to true');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        'Recording Failed',
        'Could not start voice recording. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopRecording = async (sendMessage: boolean = false) => {
    try {
      // Stop the audio recording
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      console.log('Recording stopped:', result);

      // Update UI state
      setIsRecording(false);
      setIsRecordingLocked(false);
      setSlidePosition(0);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      stopWaveformAnimation();

      // Upload and send the voice message
      if (sendMessage && recordingTime > 0 && recordingPath.current) {
        console.log('Uploading voice message:', recordingPath.current);
        setUploadingMedia(true);

        try {
          // Prepare file for upload
          const audioFile = {
            uri: Platform.select({
              ios: recordingPath.current,
              android: `file://${recordingPath.current}`,
            }),
            type: 'audio/mp4',
            name: `voice_${Date.now()}.${Platform.OS === 'ios' ? 'm4a' : 'mp4'}`,
          };

          // Upload audio file
          const mediaUrl = await uploadMediaFile(audioFile);

          if (mediaUrl) {
            // Send voice message
            const response = await messageService.sendMessage({
              conversation_id: conversationId,
              content: `Voice message (${formatTime(recordingTime)})`,
              message_type: 'AUDIO',
              media_url: mediaUrl,
            });

            if (response.success && response.data) {
              const newMessage: Message = {
                id: response.data.id,
                conversationId: response.data.conversation_id,
                senderId: response.data.sender_id,
                senderName: response.data.sender_name || 'You',
                content: response.data.content,
                type: 'AUDIO',
                status: response.data.status,
                isEncrypted: response.data.is_encrypted || false,
                mediaUrl: response.data.media_url,
                createdAt: new Date(response.data.created_at),
                updatedAt: new Date(response.data.updated_at),
              };

              setMessages(prev => [...prev, newMessage]);
              showToastNotification('Voice message sent');

              // Reload messages to ensure proper formatting
              setTimeout(() => {
                loadMessages();
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 500);
            } else {
              Alert.alert('Error', 'Failed to send voice message');
            }
          }
        } catch (error) {
          console.error('Failed to send voice message:', error);
          Alert.alert('Error', 'Failed to send voice message');
        } finally {
          setUploadingMedia(false);
        }
      }

      setRecordingTime(0);
      recordingPath.current = '';
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const cancelRecording = async () => {
    try {
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }

    setIsRecording(false);
    setIsRecordingLocked(false);
    setSlidePosition(0);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    stopWaveformAnimation();
    setRecordingTime(0);
    recordingPath.current = '';
  };

  const lockRecording = () => {
    setIsRecordingLocked(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio playback function
  const playAudio = async (audioUrl: string, messageId: string) => {
    try {
      // If this audio is already playing, pause it
      if (playingAudioId === messageId) {
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
        setPlayingAudioId(null);
        setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
        return;
      }

      // If another audio is playing, stop it first
      if (playingAudioId) {
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
        setAudioProgress(prev => ({ ...prev, [playingAudioId]: 0 }));
      }

      // Start playing the audio
      setPlayingAudioId(messageId);
      await audioRecorderPlayer.startPlayer(audioUrl);

      // Listen for playback progress
      audioRecorderPlayer.addPlayBackListener(async (e) => {
        if (e.currentPosition && e.duration) {
          const progress = (e.currentPosition / e.duration) * 100;
          setAudioProgress(prev => ({ ...prev, [messageId]: progress }));
          setAudioDuration(prev => ({ ...prev, [messageId]: Math.floor(e.duration / 1000) }));

          // Auto-stop when playback completes
          if (e.currentPosition >= e.duration) {
            await audioRecorderPlayer.stopPlayer();
            audioRecorderPlayer.removePlayBackListener();
            setPlayingAudioId(null);
            setAudioProgress(prev => ({ ...prev, [messageId]: 0 }));
          }
        }
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('Error', 'Failed to play voice message');
      setPlayingAudioId(null);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (!isRecording || isRecordingLocked) return;

      const { dx, dy } = gestureState;

      if (dy < -50) {
        console.log('Locking recording');
        lockRecording();
        return;
      }

      if (dx < 0) {
        setSlidePosition(Math.max(dx, -150));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (!isRecording || isRecordingLocked) return;

      const { dx } = gestureState;
      console.log('Swipe released', { dx });

      if (dx < -100) {
        console.log('Canceling recording via swipe');
        cancelRecording();
      }

      setSlidePosition(0);
    },
  });

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === user?.id;
    const isMediaMessage = item.type === 'IMAGE' || item.type === 'VIDEO';
    const isDocument = item.type === 'DOCUMENT';

    let documentData = null;
    if (isDocument && item.content) {
      // Handle if content is already an object
      if (typeof item.content === 'object') {
        documentData = item.content;
      } else if (typeof item.content === 'string') {
        try {
          documentData = JSON.parse(item.content);
        } catch (e) {
          console.log('Failed to parse document JSON:', item.content);
          console.log('Parse error:', e);
          // Fallback: try to extract basic info from the string
          try {
            const nameMatch = item.content.match(/"name":"([^"]+)"/);
            const sizeMatch = item.content.match(/"size":"([^"]+)"/);
            if (nameMatch && sizeMatch) {
              documentData = {
                name: nameMatch[1],
                size: sizeMatch[1],
                type: 'application/octet-stream'
              };
            }
          } catch (fallbackError) {
            console.log('Fallback parsing also failed');
          }
        }
      }
    }

    let locationData = null;
    if (item.type === 'LOCATION' && item.content) {
      try {
        locationData = JSON.parse(item.content);
      } catch (e) {
        // Ignore parse errors
      }
    }

    let contactData = null;
    if (item.type === 'CONTACT' && item.content) {
      try {
        contactData = JSON.parse(item.content);
      } catch (e) {
        // Ignore parse errors
      }
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isMine ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={() => handleLongPressMessage(item)}
          style={[
            styles.messageBubble,
            isMine ? styles.myMessage : styles.theirMessage,
            {
              backgroundColor: isMine ? theme.messageBubble.sent : theme.messageBubble.received,
            },
            isMediaMessage && styles.mediaBubble,
            isDocument && styles.documentBubble,
          ]}
        >
          {isMine && !isMediaMessage && !isDocument && (
            <View style={[styles.accentLine, { backgroundColor: theme.primaryLight }]} />
          )}

          {item.replyTo && (
            <View style={[styles.replyPreview, { backgroundColor: isMine ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)', borderLeftColor: theme.primary }]}>
              <Text style={[styles.replyPreviewSender, { color: theme.primary }]} numberOfLines={1}>
                {item.replyTo.senderName}
              </Text>
              <Text style={[styles.replyPreviewContent, { color: isMine ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary }]} numberOfLines={1}>
                {item.replyTo.content}
              </Text>
            </View>
          )}

          {item.type === 'LOCATION' && locationData ? (
            <TouchableOpacity
              style={[styles.locationContainer, { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
              onPress={() => openInGoogleMaps(locationData.latitude, locationData.longitude)}
              activeOpacity={0.7}
            >
              <View style={styles.locationMapPreview}>
                <Icon name="location" size={40} color={isMine ? theme.messageBubble.sentText : theme.primary} />
                {locationData.isLive && (
                  <View style={styles.liveLocationIndicator}>
                    <View style={[styles.liveLocationDot, { backgroundColor: '#00D46E' }]} />
                    <Text style={[styles.liveLocationText, { color: isMine ? theme.messageBubble.sentText : theme.text }]}>
                      Live Location
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.locationInfo}>
                <Text
                  style={[
                    styles.locationTitle,
                    { color: isMine ? theme.messageBubble.sentText : theme.messageBubble.receivedText },
                  ]}
                >
                  {locationData.isLive ? 'Live Location' : 'Current Location'}
                </Text>
                <Text
                  style={[
                    styles.locationCoords,
                    { color: isMine ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary },
                  ]}
                >
                  {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                </Text>
              </View>
            </TouchableOpacity>
          ) :
          item.type === 'CONTACT' && contactData ? (
            <View style={[styles.contactMessageContainer, { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <View style={styles.contactMessageContent}>
                <View style={[styles.contactMessageAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.contactMessageAvatarText}>
                    {getInitials(contactData.name)}
                  </Text>
                </View>
                <View style={styles.contactMessageInfo}>
                  <View style={styles.contactMessageHeader}>
                    <Icon
                      name="person"
                      size={16}
                      color={isMine ? theme.messageBubble.sentText : theme.text}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.contactMessageName,
                        { color: isMine ? theme.messageBubble.sentText : theme.messageBubble.receivedText },
                      ]}
                    >
                      {contactData.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.contactMessagePhone,
                      { color: isMine ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary },
                    ]}
                  >
                    {contactData.phone}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.contactMessageButton, { borderTopColor: isMine ? 'rgba(255, 255, 255, 0.2)' : theme.border }]}
                onPress={() => Linking.openURL(`tel:${contactData.phone}`)}
              >
                <Icon
                  name="chatbubble"
                  size={18}
                  color={isMine ? theme.messageBubble.sentText : theme.primary}
                />
                <Text
                  style={[
                    styles.contactMessageButtonText,
                    { color: isMine ? theme.messageBubble.sentText : theme.primary },
                  ]}
                >
                  Message {contactData.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            </View>
          ) :
          isDocument && documentData ? (
            <View style={[styles.documentContainer, { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <View style={[styles.documentIconContainer, { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]}>
                <Icon
                  name="document-text"
                  size={28}
                  color={isMine ? theme.messageBubble.sentText : theme.primary}
                />
              </View>
              <View style={styles.documentInfo}>
                <Text
                  style={[
                    styles.documentName,
                    { color: isMine ? theme.messageBubble.sentText : theme.messageBubble.receivedText },
                  ]}
                  numberOfLines={2}
                >
                  {documentData.name}
                </Text>
                <Text
                  style={[
                    styles.documentSize,
                    { color: isMine ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary },
                  ]}
                >
                  {documentData.size}
                </Text>
              </View>
            </View>
          ) :
          item.type === 'AUDIO' ? (
            <View style={[styles.audioContainer, { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <TouchableOpacity
                style={[styles.audioPlayButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.7}
                onPress={() => item.mediaUrl && playAudio(item.mediaUrl, item.id)}
              >
                <Icon
                  name={playingAudioId === item.id ? "pause" : "play"}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <View style={styles.audioWaveform}>
                <View style={[styles.audioProgressBar, { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <View style={[styles.audioProgress, { width: `${audioProgress[item.id] || 0}%`, backgroundColor: theme.primary }]} />
                </View>
              </View>
              <Text style={[styles.audioDuration, { color: isMine ? theme.messageBubble.sentText : theme.text }]}>
                {item.content.includes('(') ? item.content.match(/\(([^)]+)\)/)?.[1] : '0:00'}
              </Text>
            </View>
          ) :
          isMediaMessage && item.mediaUrl ? (
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
              {item.type === 'VIDEO' && (
                <View style={styles.videoOverlay}>
                  <Icon name="play-circle" size={48} color="rgba(255, 255, 255, 0.9)" />
                </View>
              )}
              {item.content && item.content.trim() !== '' && (
                <View style={styles.mediaCaptionContainer}>
                  <Text
                    style={[
                      styles.mediaCaption,
                      { color: isMine ? theme.messageBubble.sentText : theme.messageBubble.receivedText },
                    ]}
                  >
                    {item.content}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text
              style={[
                styles.messageText,
                { color: isMine ? theme.messageBubble.sentText : theme.messageBubble.receivedText },
              ]}
            >
              {item.content}
            </Text>
          )}

          <View style={[styles.timeContainer, isMediaMessage && styles.mediaTimeContainer]}>
            {starredMessages.has(item.id) && (
              <Icon
                name="star"
                size={12}
                color={isMine ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary}
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              style={[
                styles.messageTime,
                {
                  color: isMine ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary,
                },
              ]}
            >
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isMine && (
              <Icon
                name={item.status === 'READ' ? 'checkmark-done' : 'checkmark'}
                size={16}
                color={item.status === 'READ' ? '#4FC3F7' : 'rgba(255, 255, 255, 0.8)'}
                style={styles.checkmark}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.headerAvatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.headerAvatarText}>
                {recipientName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: theme.text }]} numberOfLines={1}>
                {recipientName}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[{ marginTop: 16, color: theme.textSecondary }]}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerContent}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('UserProfile', {
              userId: conversationId,
              userName: recipientName,
              userPhone: recipientPhone,
            });
          }}
        >
          <View style={[styles.headerAvatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.headerAvatarText}>
              {recipientName.charAt(0).toUpperCase()}
            </Text>
            {recipientStatus === 'online' && (
              <View style={[styles.onlineIndicator, { borderColor: theme.surface }]} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: theme.text }]} numberOfLines={1}>
              {recipientName}
            </Text>
            <Text style={[styles.headerStatus, { color: theme.textSecondary }]} numberOfLines={1}>
              {recipientStatus === 'online' ? 'online' : recipientPhone || 'offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleChatMenu}
            activeOpacity={0.7}
          >
            <Icon name="ellipsis-vertical" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          inverted
        />

      {/* Upload Progress */}
      {uploadingMedia && (
        <View style={[styles.uploadProgressContainer, { backgroundColor: theme.surface }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.uploadProgressText, { color: theme.text }]}>
            Uploading... {Math.round(uploadProgress)}%
          </Text>
        </View>
      )}

      {/* Reply Bar */}
      {replyingTo && (
        <View style={[styles.replyBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View style={styles.replyContent}>
            <Icon name="arrow-undo" size={20} color={theme.primary} style={styles.replyIcon} />
            <View style={styles.replyTextContainer}>
              <Text style={[styles.replyName, { color: theme.primary }]}>
                {replyingTo.senderName}
              </Text>
              <Text style={[styles.replyMessage, { color: theme.textSecondary }]} numberOfLines={1}>
                {replyingTo.content || 'Media message'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={cancelReply} style={styles.replyCancelButton}>
            <Icon name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachment}
          activeOpacity={0.7}
        >
          <Icon name="add-circle" size={28} color={theme.primary} />
        </TouchableOpacity>

        <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceElevated }]}>
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={toggleEmojiPicker}
            activeOpacity={0.7}
          >
            <Icon name="happy-outline" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
        </View>

        {inputText.trim() ? (
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSend}
            activeOpacity={0.7}
          >
            <Icon name="send" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.voiceButton, { backgroundColor: theme.primary }]}
            onLongPress={startRecording}
            onPressOut={() => {
              if (isRecording && !isRecordingLocked) {
                console.log('Released - sending recording');
                stopRecording(true);
              }
            }}
            delayLongPress={100}
            activeOpacity={0.8}
          >
            <Icon name="mic" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      </KeyboardAvoidingView>

      {/* Voice Recording UI */}
      {isRecording && (
        <>
          {console.log('Rendering recording UI, isRecording:', isRecording)}
          <View
            {...(!isRecordingLocked ? panResponder.panHandlers : {})}
            style={[
              styles.recordingOverlay,
              {
                backgroundColor: theme.surface,
                borderTopColor: theme.border,
              },
            ]}
          >
          {!isRecordingLocked && (
            <Animated.View
              style={[
                styles.lockIcon,
                {
                  opacity: slidePosition < -30 ? 0 : 1,
                },
              ]}
            >
              <View style={[styles.lockContainer, { backgroundColor: theme.surfaceElevated }]}>
                <Icon name="lock-open" size={24} color={theme.textSecondary} />
                <Icon
                  name="chevron-up"
                  size={16}
                  color={theme.textSecondary}
                  style={{ marginTop: -4 }}
                />
              </View>
            </Animated.View>
          )}

          <View style={styles.recordingContent}>
            <Animated.View
              style={[
                styles.slideToCancelContainer,
                {
                  opacity: slidePosition < -30 ? 1 : 0,
                },
              ]}
            >
              <Icon name="chevron-back" size={20} color={theme.error} />
              <Text style={[styles.slideToCancel, { color: theme.error }]}>
                Slide to cancel
              </Text>
            </Animated.View>

            <View style={styles.recordingInfo}>
              <View style={[styles.recordingDot, { backgroundColor: theme.error }]} />
              <Text style={[styles.recordingTime, { color: theme.text }]}>
                {formatTime(recordingTime)}
              </Text>

              <View style={styles.waveformContainer}>
                {waveformAnims.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveformBar,
                      {
                        backgroundColor: theme.primary,
                        transform: [
                          {
                            scaleY: anim,
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {isRecordingLocked ? (
              <View style={styles.recordingActions}>
                <TouchableOpacity
                  style={[styles.recordingActionButton, { backgroundColor: theme.error }]}
                  onPress={cancelRecording}
                  activeOpacity={0.7}
                >
                  <Icon name="trash-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.recordingActionButton, { backgroundColor: theme.primary }]}
                  onPress={() => stopRecording(true)}
                  activeOpacity={0.7}
                >
                  <Icon name="send" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.micButtonContainer,
                  {
                    transform: [{ translateX: slidePosition }],
                  },
                ]}
              >
                <View style={[styles.micButton, { backgroundColor: theme.primary }]}>
                  <Icon name="mic" size={24} color="#FFFFFF" />
                </View>
              </Animated.View>
            )}
          </View>
        </View>
        </>
      )}

      {/* WhatsApp-style Attachment Menu */}
      <AttachmentModal
        visible={showAttachmentMenu}
        onClose={closeAttachmentMenu}
        onSelectOption={handleAttachmentOption}
      />

      {/* Document Menu Modal */}
      <DocumentMenuModal
        visible={showDocumentMenu}
        onClose={closeDocumentMenu}
        onSelectType={handleDocumentType}
      />

      {/* Location Modal */}
      <LocationModal
        visible={showLocationModal}
        location={currentLocation}
        onClose={() => {
          setShowLocationModal(false);
          setCurrentLocation(null);
        }}
        onSendCurrentLocation={() => sendLocation(false)}
        onShareLiveLocation={() => sendLocation(true)}
      />

      {/* Contact Picker Modal */}
      <ContactPickerModal
        visible={showContactModal}
        contacts={filteredContacts}
        selectedContacts={selectedContacts}
        searchQuery={contactSearch}
        onClose={() => {
          setShowContactModal(false);
          setSelectedContacts([]);
          setContactSearch('');
        }}
        onSearchChange={setContactSearch}
        onToggleContact={toggleContactSelection}
        onSendContacts={sendContacts}
      />

      {/* Emoji Picker */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEmojiPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.emojiPickerContainer, { backgroundColor: theme.surface }]}>
                <View style={styles.emojiPickerHeader}>
                  <Text style={[styles.emojiPickerTitle, { color: theme.text }]}>
                    Select Emoji
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowEmojiPicker(false)}
                    style={styles.emojiPickerClose}
                  >
                    <Icon name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={POPULAR_EMOJIS}
                  numColumns={8}
                  keyExtractor={(item, index) => `emoji-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.emojiItem}
                      onPress={() => {
                        handleEmojiSelect(item);
                        setShowEmojiPicker(false);
                      }}
                    >
                      <Text style={styles.emojiText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.emojiGrid}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* WhatsApp-Style Message Actions Modal */}
      <Modal
        visible={showMessageActions}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowMessageActions(false);
          setSelectedMessage(null);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowMessageActions(false);
          setSelectedMessage(null);
        }}>
          <View style={styles.messageActionsOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.messageActionsModal, { backgroundColor: theme.surfaceElevated }]}>
                <TouchableOpacity
                  style={[styles.messageActionItem, { borderBottomColor: theme.border }]}
                  onPress={handleReply}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.messageActionText, { color: theme.text }]}>Reply</Text>
                  <Icon name="arrow-undo" size={20} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.messageActionItem, { borderBottomColor: theme.border }]}
                  onPress={handleForward}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.messageActionText, { color: theme.text }]}>Forward</Text>
                  <Icon name="arrow-redo" size={20} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.messageActionItem, { borderBottomColor: theme.border }]}
                  onPress={handleCopy}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.messageActionText, { color: theme.text }]}>Copy</Text>
                  <Icon name="copy" size={20} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.messageActionItem, { borderBottomColor: theme.border }]}
                  onPress={handleStar}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.messageActionText, { color: theme.text }]}>Star</Text>
                  <Icon name="star-outline" size={20} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.messageActionItem, { borderBottomColor: theme.border }]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.messageActionText, { color: '#FF3B30' }]}>Delete</Text>
                  <Icon name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.messageActionItem}
                  onPress={handleMessageInfo}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.messageActionText, { color: theme.text }]}>More...</Text>
                  <Icon name="ellipsis-horizontal-circle-outline" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Forward Modal */}
      <ForwardModal
        visible={showForwardModal}
        availableChats={availableChats}
        selectedChatIds={selectedForwardChats}
        searchQuery={forwardSearchQuery}
        onClose={cancelForward}
        onSearchChange={setForwardSearchQuery}
        onToggleChat={toggleForwardChatSelection}
        onConfirmForward={confirmForward}
      />

      {/* Delete Modal */}
      <DeleteMessageModal
        visible={showDeleteModal}
        canDeleteForEveryone={Boolean(
          messageToDelete &&
          messageToDelete.senderId === user?.id
        )}
        onClose={cancelDelete}
        onDeleteForMe={deleteForMe}
        onDeleteForEveryone={deleteForEveryone}
      />

      {/* Toast Notification */}
      {showToast && (
        <View style={styles.toastContainer}>
          <View style={[styles.toast, { backgroundColor: '#333333' }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}

      {/* Message Info Modal */}
      <MessageInfoModal
        visible={showMessageInfoModal}
        message={messageForInfo}
        recipientName={recipientName}
        onClose={closeMessageInfo}
      />
    </SafeAreaView>
  );
};

// Keep all the original styles from the previous file
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D46E',
    borderWidth: 2,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  messageList: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  myMessage: {
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    borderBottomLeftRadius: 4,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 4,
    paddingLeft: 0,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 11,
  },
  checkmark: {
    marginLeft: 4,
  },
  mediaBubble: {
    padding: 3,
    maxWidth: '80%',
  },
  mediaContainer: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  mediaImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mediaCaptionContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  mediaCaption: {
    fontSize: 14,
    lineHeight: 18,
  },
  mediaTimeContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  documentBubble: {
    padding: 0,
    maxWidth: '80%',
    minWidth: 240,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 13,
  },
  locationContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 240,
  },
  locationMapPreview: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    position: 'relative',
  },
  liveLocationIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationInfo: {
    padding: 12,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 13,
  },
  contactMessageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 250,
  },
  contactMessageContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  contactMessageAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactMessageAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  contactMessageInfo: {
    flex: 1,
  },
  contactMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactMessageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactMessagePhone: {
    fontSize: 14,
  },
  contactMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  contactMessageButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emojiPickerContainer: {
    width: '100%',
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emojiPickerClose: {
    padding: 4,
  },
  emojiGrid: {
    padding: 16,
  },
  emojiItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  emojiText: {
    fontSize: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  attachButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  emojiButton: {
    padding: 4,
    marginRight: 4,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1000,
    elevation: 10,
  },
  lockIcon: {
    position: 'absolute',
    top: -60,
    right: 20,
    zIndex: 10,
  },
  lockContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  recordingActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonContainer: {
    marginLeft: 'auto',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 4,
  },
  recordingTime: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    gap: 2.5,
    flex: 1,
    marginLeft: 12,
  },
  waveformBar: {
    width: 2.5,
    height: 30,
    borderRadius: 1.5,
  },
  slideToCancelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  slideToCancel: {
    fontSize: 13,
    fontWeight: '400',
    marginLeft: 4,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 200,
    padding: 8,
    borderRadius: 12,
  },
  audioPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveform: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  audioProgressBar: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioProgress: {
    height: '100%',
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  messageActionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageActionsModal: {
    width: '80%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  messageActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  messageActionText: {
    fontSize: 16,
    fontWeight: '400',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  replyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  replyIcon: {
    marginRight: 4,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyMessage: {
    fontSize: 13,
  },
  replyCancelButton: {
    padding: 4,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 6,
    marginBottom: 8,
    borderRadius: 4,
  },
  replyPreviewSender: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreviewContent: {
    fontSize: 12,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  uploadProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  uploadProgressText: {
    fontSize: 14,
  },
});

export default ChatRoomScreen;
