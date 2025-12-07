import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Geolocation from '@react-native-community/geolocation';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ChatStackParamList, Message, Conversation } from '../../types';
import { Theme } from '../../constants/theme';
import { getAllChats, getUserById, getMessagesForChat, Message as MockMessage, mockOneOnOneChats } from '../../data/mockData';
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

  const [messages, setMessages] = useState<Message[]>([]);
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

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  ).current;

  // Mock contacts data (replace with real contacts API later)
  const mockContacts = [
    { id: '1', name: 'Alice Johnson', phone: '+1 234-567-8901' },
    { id: '2', name: 'Bob Smith', phone: '+1 234-567-8902' },
    { id: '3', name: 'Charlie Brown', phone: '+1 234-567-8903' },
    { id: '4', name: 'Diana Prince', phone: '+1 234-567-8904' },
    { id: '5', name: 'Ethan Hunt', phone: '+1 234-567-8905' },
    { id: '6', name: 'Fiona Gallagher', phone: '+1 234-567-8906' },
    { id: '7', name: 'George Wilson', phone: '+1 234-567-8907' },
    { id: '8', name: 'Hannah Montana', phone: '+1 234-567-8908' },
    { id: '9', name: 'Ian Malcolm', phone: '+1 234-567-8909' },
    { id: '10', name: 'Julia Roberts', phone: '+1 234-567-8910' },
  ];

  useEffect(() => {
    // Load recipient info
    const chat = mockOneOnOneChats.find(c => c.id === conversationId);
    if (chat) {
      const otherUserId = chat.participants.find(id => id !== 'current');
      const otherUser = otherUserId ? getUserById(otherUserId) : null;
      if (otherUser) {
        setRecipientPhone(otherUser.phoneNumber);
        setRecipientStatus(otherUser.status === 'online' ? 'online' : 'offline');
      }
    }

    // Load existing messages from mock data
    loadMessages();

    // Load available chats for forwarding
    loadAvailableChats();
  }, [conversationId]);

  const loadAvailableChats = () => {
    const mockChats = getAllChats();

    // Convert mock chats to Conversation format
    const formattedConversations: Conversation[] = mockChats
      .filter(chat => chat.id !== conversationId) // Exclude current conversation
      .map((chat) => {
        if (chat.type === 'group') {
          return {
            id: chat.id,
            name: chat.name,
            avatar: undefined,
            lastMessage: {
              content: chat.lastMessage.text,
              createdAt: chat.lastMessage.timestamp,
            },
            unreadCount: chat.unreadCount,
            isTyping: false,
          };
        } else {
          const otherUserId = chat.participants.find(id => id !== 'current');
          const otherUser = otherUserId ? getUserById(otherUserId) : undefined;

          return {
            id: chat.id,
            name: otherUser?.name || 'Unknown',
            avatar: otherUser?.avatar,
            lastMessage: {
              content: chat.lastMessage.text,
              createdAt: chat.lastMessage.timestamp,
            },
            unreadCount: chat.unreadCount,
            isTyping: false,
          };
        }
      });

    setAvailableChats(formattedConversations);
  };

  const loadMessages = async () => {
    // Load messages from mock data
    const mockMessages = getMessagesForChat(conversationId);

    // Convert mock messages to Message format
    const formattedMessages: Message[] = mockMessages.map((msg: MockMessage) => {
      const sender = getUserById(msg.senderId);
      return {
        id: msg.id,
        conversationId: conversationId,
        senderId: msg.senderId,
        senderName: sender?.name || 'Unknown',
        content: msg.text,
        type: 'TEXT',
        status: msg.status.toUpperCase() as any,
        isEncrypted: true,
        createdAt: new Date(msg.timestamp),
        updatedAt: new Date(msg.timestamp),
      };
    });

    setMessages(formattedMessages);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `msg-new-${Date.now()}`,
      conversationId,
      senderId: 'current',
      senderName: user?.displayName || 'You',
      content: inputText.trim(),
      type: 'TEXT',
      status: 'SENT',
      isEncrypted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        content: replyingTo.content || 'Media',
      } : undefined,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setReplyingTo(null);

    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
          // Camera with instant preview
          handleCameraCapture();
          break;
        case 'gallery':
          // Gallery with multi-select
          handleGalleryPicker();
          break;
        case 'document':
          // Document picker with preview
          handleDocumentPicker();
          break;
        case 'location':
          // Live location sharing
          handleLocationShare();
          break;
        case 'contact':
          // Contact picker
          handleContactPicker();
          break;
      }
    }, 300);
  };

  const handleCameraCapture = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'mixed', // Allow both photo and video
        saveToPhotos: true,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type?.includes('video');
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          conversationId,
          senderId: 'current',
          senderName: user?.displayName || 'You',
          content: '', // No caption by default, just show the image
          type: isVideo ? 'VIDEO' : 'IMAGE',
          status: 'SENT',
          isEncrypted: true,
          mediaUrl: asset.uri,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
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
        selectionLimit: 10, // Allow selecting up to 10 items
      });

      if (result.assets) {
        result.assets.forEach((asset, index) => {
          const isVideo = asset.type?.includes('video');
          const newMessage: Message = {
            id: `msg-${Date.now()}-${index}`,
            conversationId,
            senderId: 'current',
            senderName: user?.displayName || 'You',
            content: '', // No caption by default, just show the image
            type: isVideo ? 'VIDEO' : 'IMAGE',
            status: 'SENT',
            isEncrypted: true,
            mediaUrl: asset.uri,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setMessages(prev => [...prev, newMessage]);
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleDocumentPicker = () => {
    // WhatsApp-style: Show document type selection bottom sheet
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
          // Open document picker
          const result = await DocumentPicker.pick({
            type: [DocumentPicker.types.allFiles],
            allowMultiSelection: false,
          });

          if (result[0]) {
            const doc = result[0];
            const sizeInKB = doc.size ? Math.round(doc.size / 1024) : 0;
            const sizeInMB = doc.size ? (doc.size / 1024 / 1024).toFixed(1) : '0.0';
            const displaySize = sizeInKB < 1024 ? `${sizeInKB} KB` : `${sizeInMB} MB`;

            const newMessage: Message = {
              id: `msg-doc-${Date.now()}`,
              conversationId,
              senderId: 'current',
              senderName: user?.displayName || 'You',
              content: JSON.stringify({
                name: doc.name,
                size: displaySize,
                type: doc.type || 'application/octet-stream',
              }),
              type: 'DOCUMENT',
              status: 'SENT',
              isEncrypted: true,
              mediaUrl: doc.uri,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setMessages(prev => [...prev, newMessage]);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        } else if (type === 'gallery') {
          // Open gallery
          handleGalleryPicker();
        } else if (type === 'camera') {
          // Open camera
          handleCameraCapture();
        }
      } catch (err) {
        if (DocumentPicker.isCancel(err)) {
          // User cancelled
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
      // Get current location and show modal
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

  const sendLocation = (isLive: boolean) => {
    if (!currentLocation) return;

    const locationData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      isLive,
    };

    const newMessage: Message = {
      id: `msg-loc-${Date.now()}`,
      conversationId,
      senderId: 'current',
      senderName: user?.displayName || 'You',
      content: JSON.stringify(locationData),
      type: 'LOCATION',
      status: 'SENT',
      isEncrypted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setShowLocationModal(false);
    setCurrentLocation(null);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
          // Fallback to Google Maps web
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      });
    }
  };

  const handleContactPicker = () => {
    closeAttachmentMenu();
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

  const sendContacts = () => {
    if (selectedContacts.length === 0) return;

    // Send each contact as a separate message (like WhatsApp)
    selectedContacts.forEach((contact, index) => {
      setTimeout(() => {
        const newMessage: Message = {
          id: `msg-contact-${Date.now()}-${index}`,
          conversationId,
          senderId: 'current',
          senderName: user?.displayName || 'You',
          content: JSON.stringify({
            name: contact.name,
            phone: contact.phone,
          }),
          type: 'CONTACT',
          status: 'SENT',
          isEncrypted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
      }, index * 100);
    });

    setShowContactModal(false);
    setSelectedContacts([]);
    setContactSearch('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, selectedContacts.length * 100 + 100);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const filteredContacts = mockContacts.filter(contact =>
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

  const confirmForward = () => {
    if (selectedForwardChats.length > 0) {
      // Here you would actually forward the message to the selected chats
      // When backend is ready, make API calls to forward the message
      showToastNotification(`Message forwarded to ${selectedForwardChats.length} chat${selectedForwardChats.length > 1 ? 's' : ''}`);
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

  const deleteForMe = () => {
    if (messageToDelete) {
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
      showToastNotification('Message deleted');
      setShowDeleteModal(false);
      setMessageToDelete(null);
      setSelectedMessage(null);
    }
  };

  const deleteForEveryone = () => {
    if (messageToDelete) {
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
      showToastNotification('Message deleted for everyone');
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

  const handleStar = () => {
    if (selectedMessage) {
      setShowMessageActions(false);
      const newStarred = new Set(starredMessages);
      if (newStarred.has(selectedMessage.id)) {
        newStarred.delete(selectedMessage.id);
        showToastNotification('Message unstarred');
      } else {
        newStarred.add(selectedMessage.id);
        showToastNotification('Message starred');
      }
      setStarredMessages(newStarred);
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

  const handleChatMenu = () => {
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
          onPress: () => Alert.alert('Muted', 'Notifications muted for this chat'),
        },
        {
          text: 'Clear Chat',
          onPress: () => Alert.alert('Clear Chat', 'Are you sure you want to clear all messages?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) },
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

  const startRecording = () => {
    console.log('startRecording called');
    setIsRecording(true);
    setRecordingTime(0);
    setIsRecordingLocked(false);
    setSlidePosition(0);

    // Start timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    // Start waveform animation
    startWaveformAnimation();
    console.log('Recording started, isRecording set to true');
  };

  const stopRecording = (sendMessage: boolean = false) => {
    setIsRecording(false);
    setIsRecordingLocked(false);
    setSlidePosition(0);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    stopWaveformAnimation();

    if (sendMessage && recordingTime > 0) {
      // Send voice message
      const newMessage: Message = {
        id: Date.now().toString(),
        content: `Voice message (${formatTime(recordingTime)})`,
        senderId: user?.id || 'current',
        type: 'AUDIO',
        createdAt: new Date().toISOString(),
        status: 'SENT',
      };
      setMessages((prev) => [newMessage, ...prev]);
    }

    setRecordingTime(0);
  };

  const cancelRecording = () => {
    stopRecording(false);
  };

  const lockRecording = () => {
    setIsRecordingLocked(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (!isRecording || isRecordingLocked) return;

      const { dx, dy } = gestureState;

      // Check for upward slide to lock
      if (dy < -50) {
        console.log('Locking recording');
        lockRecording();
        return;
      }

      // Update slide position for cancel animation
      if (dx < 0) {
        setSlidePosition(Math.max(dx, -150));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (!isRecording || isRecordingLocked) return;

      const { dx } = gestureState;
      console.log('Swipe released', { dx });

      // Cancel if slid too far left
      if (dx < -100) {
        console.log('Canceling recording via swipe');
        cancelRecording();
      }

      // Reset slide position
      setSlidePosition(0);
    },
  });

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === 'current' || item.senderId === user?.id;
    const isMediaMessage = item.type === 'IMAGE' || item.type === 'VIDEO';
    const isDocument = item.type === 'DOCUMENT';

    // Parse document data if it's a document
    let documentData = null;
    if (isDocument && item.content) {
      try {
        documentData = JSON.parse(item.content);
      } catch (e) {
        // If parsing fails, treat as regular text
      }
    }

    // Parse location data if it's a location
    let locationData = null;
    if (item.type === 'LOCATION' && item.content) {
      try {
        locationData = JSON.parse(item.content);
      } catch (e) {
        // If parsing fails, treat as regular text
      }
    }

    // Parse contact data if it's a contact
    let contactData = null;
    if (item.type === 'CONTACT' && item.content) {
      try {
        contactData = JSON.parse(item.content);
      } catch (e) {
        // If parsing fails, treat as regular text
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
          {/* Subtle accent line for sent messages */}
          {isMine && !isMediaMessage && !isDocument && (
            <View style={[styles.accentLine, { backgroundColor: theme.primaryLight }]} />
          )}

          {/* Reply Preview */}
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

          {/* Render location */}
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
          /* Render contact */
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
          /* Render document */
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
          /* Render audio/voice message */
          item.type === 'AUDIO' ? (
            <View style={[styles.audioContainer, { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <TouchableOpacity
                style={[styles.audioPlayButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.7}
              >
                <Icon name="play" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.audioWaveform}>
                <View style={[styles.audioProgressBar, { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <View style={[styles.audioProgress, { width: '0%', backgroundColor: theme.primary }]} />
                </View>
              </View>
              <Text style={[styles.audioDuration, { color: isMine ? theme.messageBubble.sentText : theme.text }]}>
                {item.content.includes('(') ? item.content.match(/\(([^)]+)\)/)?.[1] : '0:00'}
              </Text>
            </View>
          ) :
          /* Render image/video preview */
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
                name="checkmark-done"
                size={16}
                color="rgba(255, 255, 255, 0.8)"
                style={styles.checkmark}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

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
          (messageToDelete.senderId === 'current' || messageToDelete.senderId === user?.id)
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
  // Contact Message Styles
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
  // Location Modal Styles
  locationModalContainer: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  locationModalMap: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationModalCoords: {
    marginTop: 8,
    fontSize: 12,
  },
  locationModalInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationModalSubtitle: {
    fontSize: 14,
  },
  locationModalActions: {
    padding: 16,
  },
  locationModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationModalButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 12,
  },
  locationModalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationModalCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  locationModalCancelText: {
    fontSize: 16,
  },
  // Contact Modal Styles
  contactModalContainer: {
    width: '100%',
    height: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  contactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  contactModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  contactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  contactList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
  },
  contactModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  contactSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  contactSendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
    borderRadius: 30,
    marginHorizontal: 8,
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
  stopRecordingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  documentMenu: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  documentMenuHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  documentMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  documentMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  documentIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentMenuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  // WhatsApp-Style Message Actions Modal Styles
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
  // Reply Bar Styles
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
  // Reply Preview in Message Bubble
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
  // Toast Notification
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
  // Forward Modal Styles
  forwardModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  forwardModal: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  forwardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  forwardCancelButton: {
    padding: 4,
  },
  forwardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  forwardSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  forwardSearchIcon: {
    marginRight: 8,
  },
  forwardSearchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  forwardChatList: {
    flex: 1,
  },
  forwardChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  forwardChatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  forwardChatAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  forwardChatInfo: {
    flex: 1,
    marginRight: 12,
  },
  forwardChatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  forwardChatLastMessage: {
    fontSize: 14,
  },
  forwardCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forwardEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  forwardEmptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  forwardButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  forwardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  forwardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  deleteModal: {
    borderRadius: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  deleteModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  deleteModalIcon: {
    marginRight: 16,
  },
  deleteModalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteModalCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Message Info Modal Styles
  messageInfoContainer: {
    flex: 1,
  },
  messageInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  messageInfoBackButton: {
    padding: 8,
    marginRight: 12,
  },
  messageInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  messageInfoContent: {
    flex: 1,
  },
  messageInfoBubbleContainer: {
    padding: 16,
    alignItems: 'flex-end',
  },
  messageInfoBubble: {
    maxWidth: '80%',
    borderRadius: 8,
    padding: 12,
  },
  messageInfoBubbleText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messageInfoBubbleTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  messageInfoSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  messageInfoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  messageInfoSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  messageInfoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageInfoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageInfoItemName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  messageInfoItemTime: {
    fontSize: 13,
  },
});

export default ChatRoomScreen;
