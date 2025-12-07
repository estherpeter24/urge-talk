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
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
  Image,
  Clipboard,
  Alert,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Geolocation from '@react-native-community/geolocation';
import Contacts from 'react-native-contacts';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ChatStackParamList, Message, Conversation } from '../../types';
import { Theme } from '../../constants/theme';
import { mockGroupChats, mockGroupMessages, getUserById, getAllChats } from '../../data/mockData';
import { messageService } from '../../services/api';
import AttachmentModal from '../../components/chat/AttachmentModal';
import DocumentMenuModal from '../../components/chat/DocumentMenuModal';
import LocationModal from '../../components/chat/LocationModal';
import ContactPickerModal, { Contact } from '../../components/chat/ContactPickerModal';
import MessageInfoModal from '../../components/chat/MessageInfoModal';
import ForwardModal from '../../components/chat/ForwardModal';
import DeleteMessageModal from '../../components/chat/DeleteMessageModal';

type Props = NativeStackScreenProps<ChatStackParamList, 'GroupChat'>;

interface GroupParticipant {
  id: string;
  name: string;
  isAdmin: boolean;
}

const GroupChatScreen = ({ route, navigation }: Props) => {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Message actions states
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

  // Group info states
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);

  // Participant actions states
  const [showParticipantActions, setShowParticipantActions] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<GroupParticipant | null>(null);

  // Exit group modal state
  const [showExitGroupModal, setShowExitGroupModal] = useState(false);

  // Attachment menu state
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Additional attachment states
  const [showDocumentMenu, setShowDocumentMenu] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);

  // Device contacts state
  const [deviceContacts, setDeviceContacts] = useState<Array<{ id: string; name: string; phone: string }>>([]);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load group data
    const group = mockGroupChats.find(g => g.id === groupId);
    if (group) {
      setGroupName(group.name);
      setGroupDescription(group.description || 'No description');

      // Mock participants
      setParticipants([
        { id: 'current', name: user?.displayName || 'You', isAdmin: true },
        { id: 'user2', name: 'John Doe', isAdmin: false },
        { id: 'user3', name: 'Jane Smith', isAdmin: false },
        { id: 'user4', name: 'Bob Johnson', isAdmin: true },
      ]);

      setIsAdmin(true); // Current user is admin
    }

    // Load messages
    loadMessages();

    // Load available chats for forwarding
    loadAvailableChats();
  }, [groupId]);

  const loadMessages = async () => {
    const groupMessages = mockGroupMessages[groupId] || [];

    const formattedMessages: Message[] = groupMessages.map((msg) => {
      const sender = getUserById(msg.senderId);
      return {
        id: msg.id,
        conversationId: groupId,
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

  const loadAvailableChats = () => {
    const mockChats = getAllChats();

    // Convert mock chats to Conversation format
    const formattedConversations: Conversation[] = mockChats
      .filter(chat => chat.id !== groupId) // Exclude current group
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

  const loadDeviceContacts = async () => {
    try {
      if (Platform.OS === 'ios') {
        const permission = await Contacts.requestPermission();
        if (permission === 'authorized') {
          const contacts = await Contacts.getAll();
          const formattedContacts = contacts
            .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
            .map(contact => ({
              id: contact.recordID,
              name: `${contact.givenName || ''} ${contact.familyName || ''}`.trim() || 'Unknown',
              phone: contact.phoneNumbers[0]?.number || '',
            }));
          setDeviceContacts(formattedContacts);
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts.',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          const contacts = await Contacts.getAll();
          const formattedContacts = contacts
            .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
            .map(contact => ({
              id: contact.recordID,
              name: `${contact.givenName || ''} ${contact.familyName || ''}`.trim() || 'Unknown',
              phone: contact.phoneNumbers[0]?.number || '',
            }));
          setDeviceContacts(formattedContacts);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `msg-new-${Date.now()}`,
      conversationId: groupId,
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

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Message action handlers
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

  const handleCopy = async () => {
    if (selectedMessage && selectedMessage.content) {
      Clipboard.setString(selectedMessage.content);
      setShowMessageActions(false);
      showToastNotification('Message copied');
      setSelectedMessage(null);
    }
  };

  const handleDelete = () => {
    if (selectedMessage) {
      setShowMessageActions(false);
      setMessageToDelete(selectedMessage);
      setShowDeleteModal(true);
    }
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
    setTimeout(() => setShowToast(false), 2000);
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

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleGroupInfo = () => {
    setShowGroupInfo(true);
  };

  const handleExitGroup = () => {
    console.log('Exit group clicked');
    setShowExitGroupModal(true);
    console.log('showExitGroupModal set to true');
  };

  const confirmExitGroup = () => {
    setShowExitGroupModal(false);
    showToastNotification('You left the group');
    navigation.goBack();
  };

  const cancelExitGroup = () => {
    setShowExitGroupModal(false);
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
      switch (type.toLowerCase()) {
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

  const sendMediaMessage = async (mediaUrl: string, type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT', content?: string) => {
    try {
      const response = await messageService.sendMessage({
        conversation_id: groupId,
        content: content || '',
        message_type: type,
        media_url: mediaUrl,
      });

      console.log(`📸 ${type} message response (group):`, JSON.stringify(response, null, 2));

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
        console.log(`📸 Created ${type} message (group):`, JSON.stringify(newMessage, null, 2));
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Send media message error (group):', error);
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
        if (asset.uri) {
          await sendMediaMessage(asset.uri, isVideo ? 'VIDEO' : 'IMAGE');
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
          if (asset.uri) {
            const isVideo = asset.type?.includes('video');
            await sendMediaMessage(asset.uri, isVideo ? 'VIDEO' : 'IMAGE');
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
            const sizeInKB = doc.size ? Math.round(doc.size / 1024) : 0;
            const sizeInMB = doc.size ? (doc.size / 1024 / 1024).toFixed(1) : '0.0';
            const displaySize = sizeInKB < 1024 ? `${sizeInKB} KB` : `${sizeInMB} MB`;

            const newMessage: Message = {
              id: `msg-doc-${Date.now()}`,
              conversationId: groupId,
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

  const closeDocumentMenu = () => {
    setShowDocumentMenu(false);
  };

  const handleLocationShare = async () => {
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

  const sendLocation = (isLive: boolean) => {
    if (!currentLocation) return;

    const locationData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      isLive,
    };

    const newMessage: Message = {
      id: `msg-loc-${Date.now()}`,
      conversationId: groupId,
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
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      });
    }
  };

  const handleContactPicker = async () => {
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
    if (selectedContacts.length === 0) return;

    for (const contact of selectedContacts) {
      try {
        const response = await messageService.sendMessage({
          conversation_id: groupId,
          content: JSON.stringify({
            name: contact.name,
            phone: contact.phone,
          }),
          message_type: 'CONTACT',
        });

        console.log('📧 Contact message response (group):', JSON.stringify(response, null, 2));

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
          console.log('📧 Created contact message (group):', JSON.stringify(newMessage, null, 2));
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (error) {
        console.error('Send contact error (group):', error);
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

  const handleRemoveParticipant = () => {
    if (selectedParticipant) {
      setParticipants(prev => prev.filter(p => p.id !== selectedParticipant.id));
      showToastNotification('Participant removed');
      setShowParticipantActions(false);
      setSelectedParticipant(null);
    }
  };

  const handleMakeAdmin = () => {
    if (selectedParticipant) {
      setParticipants(prev =>
        prev.map(p =>
          p.id === selectedParticipant.id ? { ...p, isAdmin: true } : p
        )
      );
      showToastNotification('Made group admin');
      setShowParticipantActions(false);
      setSelectedParticipant(null);
    }
  };

  const openParticipantActions = (participant: GroupParticipant) => {
    console.log('Opening participant actions for:', participant);
    setSelectedParticipant(participant);
    setShowParticipantActions(true);
    console.log('Modal state set to true');
  };

  const closeParticipantActions = () => {
    setShowParticipantActions(false);
    setSelectedParticipant(null);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === 'current' || item.senderId === user?.id;

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPressMessage(item)}
        activeOpacity={0.9}
        style={[
          styles.messageContainer,
          isMine ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myMessage : styles.theirMessage,
            {
              backgroundColor: isMine ? theme.messageBubble.sent : theme.messageBubble.received,
            },
          ]}
        >
          {isMine && (
            <View style={[styles.accentLine, { backgroundColor: theme.primaryLight }]} />
          )}

          {!isMine && (
            <Text style={[styles.senderName, { color: theme.primary }]}>
              {item.senderName}
            </Text>
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

          <Text
            style={[
              styles.messageText,
              { color: isMine ? theme.messageBubble.sentText : theme.messageBubble.receivedText },
            ]}
          >
            {item.content}
          </Text>

          <View style={styles.timeContainer}>
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerContent} onPress={handleGroupInfo}>
          <View style={[styles.groupIcon, { backgroundColor: theme.primary }]}>
            <Icon name="people" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.groupName, { color: theme.text }]}>{groupName}</Text>
            <Text style={[styles.participantCount, { color: theme.textSecondary }]}>
              {participants.length} participants
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={handleGroupInfo}>
          <Icon name="ellipsis-vertical" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {/* Reply Bar */}
        {replyingTo && (
          <View style={[styles.replyBar, { backgroundColor: theme.surfaceElevated, borderTopColor: theme.border }]}>
            <View style={styles.replyBarContent}>
              <View style={[styles.replyBarAccent, { backgroundColor: theme.primary }]} />
              <View style={styles.replyBarText}>
                <Text style={[styles.replyBarSender, { color: theme.primary }]}>{replyingTo.senderName}</Text>
                <Text style={[styles.replyBarMessage, { color: theme.text }]} numberOfLines={1}>
                  {replyingTo.content}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={cancelReply} style={styles.replyBarClose}>
              <Icon name="close" size={20} color={theme.textSecondary} />
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
          <TouchableOpacity style={styles.attachButton} onPress={handleAttachment}>
            <Icon name="add-circle-outline" size={Theme.iconSize.md} color={theme.primary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Icon name="send" size={Theme.iconSize.sm} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Message Actions Modal */}
      <Modal
        visible={showMessageActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageActions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMessageActions(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.actionsModal, { backgroundColor: theme.surface }]}>
                <TouchableOpacity style={styles.actionItem} onPress={handleReply}>
                  <Icon name="arrow-undo" size={20} color={theme.text} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Reply</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={handleForward}>
                  <Icon name="arrow-redo" size={20} color={theme.text} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Forward</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={handleCopy}>
                  <Icon name="copy-outline" size={20} color={theme.text} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={handleStar}>
                  <Icon name="star-outline" size={20} color={theme.text} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Star</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
                  <Icon name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={handleMessageInfo}>
                  <Icon name="information-circle-outline" size={20} color={theme.text} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Info</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <TouchableWithoutFeedback onPress={cancelDelete}>
          <View style={styles.deleteModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.deleteModal, { backgroundColor: theme.surface }]}>
                <Text style={[styles.deleteModalTitle, { color: theme.text }]}>Delete message?</Text>

                <TouchableOpacity
                  style={[styles.deleteModalOption, { borderBottomColor: theme.border }]}
                  onPress={deleteForMe}
                  activeOpacity={0.7}
                >
                  <Icon name="trash-outline" size={22} color={theme.text} style={styles.deleteModalIcon} />
                  <Text style={[styles.deleteModalOptionText, { color: theme.text }]}>Delete for me</Text>
                </TouchableOpacity>

                {messageToDelete && (messageToDelete.senderId === 'current' || messageToDelete.senderId === user?.id) && isAdmin && (
                  <TouchableOpacity
                    style={[styles.deleteModalOption, { borderBottomColor: theme.border }]}
                    onPress={deleteForEveryone}
                    activeOpacity={0.7}
                  >
                    <Icon name="trash" size={22} color="#FF3B30" style={styles.deleteModalIcon} />
                    <Text style={[styles.deleteModalOptionText, { color: '#FF3B30' }]}>Delete for everyone</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.deleteModalCancel}
                  onPress={cancelDelete}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.deleteModalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Forward Modal */}
      <Modal
        visible={showForwardModal}
        transparent
        animationType="slide"
        onRequestClose={cancelForward}
      >
        <View style={styles.forwardModalContainer}>
          <View style={[styles.forwardModal, { backgroundColor: theme.surface }]}>
            {/* Header */}
            <View style={[styles.forwardHeader, { borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={cancelForward} style={styles.forwardCancelButton}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.forwardTitle, { color: theme.text }]}>Forward message to...</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={[styles.forwardSearchContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Icon name="search" size={20} color={theme.textSecondary} style={styles.forwardSearchIcon} />
              <TextInput
                style={[styles.forwardSearchInput, { color: theme.text }]}
                placeholder="Search chats..."
                placeholderTextColor={theme.textSecondary}
                value={forwardSearchQuery}
                onChangeText={setForwardSearchQuery}
              />
            </View>

            {/* Chat List */}
            <FlatList
              data={availableChats.filter(chat =>
                chat.name?.toLowerCase().includes(forwardSearchQuery.toLowerCase())
              )}
              keyExtractor={item => item.id}
              style={styles.forwardChatList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.forwardChatItem, { borderBottomColor: theme.border }]}
                  onPress={() => toggleForwardChatSelection(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.forwardChatAvatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.forwardChatAvatarText}>
                      {item.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.forwardChatInfo}>
                    <Text style={[styles.forwardChatName, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.lastMessage && (
                      <Text style={[styles.forwardChatLastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
                        {item.lastMessage.content}
                      </Text>
                    )}
                  </View>
                  <View style={[
                    styles.forwardCheckbox,
                    { borderColor: selectedForwardChats.includes(item.id) ? theme.primary : theme.border },
                    selectedForwardChats.includes(item.id) && { backgroundColor: theme.primary }
                  ]}>
                    {selectedForwardChats.includes(item.id) && (
                      <Icon name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.forwardEmptyContainer}>
                  <Icon name="chatbubbles-outline" size={48} color={theme.textSecondary} />
                  <Text style={[styles.forwardEmptyText, { color: theme.textSecondary }]}>
                    {forwardSearchQuery ? 'No chats found' : 'No chats available'}
                  </Text>
                </View>
              }
            />

            {/* Forward Button */}
            {selectedForwardChats.length > 0 && (
              <View style={[styles.forwardButtonContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.forwardButton, { backgroundColor: theme.primary }]}
                  onPress={confirmForward}
                  activeOpacity={0.8}
                >
                  <Icon name="arrow-forward" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.forwardButtonText}>
                    Forward to {selectedForwardChats.length} {selectedForwardChats.length === 1 ? 'chat' : 'chats'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Group Info Modal */}
      <Modal
        visible={showGroupInfo}
        animationType="slide"
        onRequestClose={() => setShowGroupInfo(false)}
      >
        <SafeAreaView style={[styles.groupInfoContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.groupInfoHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowGroupInfo(false)} style={styles.groupInfoBackButton}>
              <Icon name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.groupInfoTitle, { color: theme.text }]}>Group Info</Text>
          </View>

          <ScrollView>
            {/* Group Details */}
            <View style={[styles.groupInfoSection, { backgroundColor: theme.surface }]}>
              <View style={[styles.groupIconLarge, { backgroundColor: theme.primary }]}>
                <Icon name="people" size={60} color="#FFFFFF" />
              </View>
              <Text style={[styles.groupNameLarge, { color: theme.text }]}>{groupName}</Text>
              <Text style={[styles.groupDescription, { color: theme.textSecondary }]}>{groupDescription}</Text>
              <Text style={[styles.groupCreated, { color: theme.textSecondary }]}>
                Created by You on {new Date().toLocaleDateString()}
              </Text>
            </View>

            {/* Participants */}
            <View style={[styles.participantsSection, { backgroundColor: theme.surface }]}>
              <View style={styles.participantsHeader}>
                <Text style={[styles.participantsTitle, { color: theme.text }]}>
                  {participants.length} Participants
                </Text>
                {isAdmin && (
                  <TouchableOpacity onPress={() => setShowAddParticipant(true)}>
                    <Icon name="person-add" size={24} color={theme.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {participants.map((participant) => (
                <View key={participant.id} style={[styles.participantItem, { borderBottomColor: theme.border }]}>
                  <View style={[styles.participantAvatar, { backgroundColor: theme.surfaceElevated }]}>
                    <Icon name="person" size={20} color={theme.textSecondary} />
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={[styles.participantName, { color: theme.text }]}>
                      {participant.name}
                      {participant.id === 'current' && ' (You)'}
                    </Text>
                    {participant.isAdmin && (
                      <Text style={[styles.adminBadge, { color: theme.textSecondary }]}>Group Admin</Text>
                    )}
                  </View>

                  {isAdmin && participant.id !== 'current' && (
                    <TouchableOpacity onPress={() => openParticipantActions(participant)}>
                      <Icon name="ellipsis-vertical" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Group Actions */}
            <View style={[styles.groupActionsSection, { backgroundColor: theme.surface }]}>
              <TouchableOpacity
                style={[styles.groupAction, { borderBottomColor: theme.border }]}
                onPress={() => {
                  console.log('Mute notifications clicked');
                  showToastNotification('Mute notifications feature coming soon');
                }}
              >
                <Icon name="notifications-outline" size={24} color={theme.text} />
                <Text style={[styles.groupActionText, { color: theme.text }]}>Mute notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.groupAction, { borderBottomColor: theme.border }]}
                onPress={() => {
                  console.log('Media, links, and docs clicked');
                  showToastNotification('Media, links, and docs feature coming soon');
                }}
              >
                <Icon name="image-outline" size={24} color={theme.text} />
                <Text style={[styles.groupActionText, { color: theme.text }]}>Media, links, and docs</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.groupAction} onPress={handleExitGroup}>
                <Icon name="exit-outline" size={24} color="#FF3B30" />
                <Text style={[styles.groupActionText, { color: '#FF3B30' }]}>Exit group</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Participant Actions Modal - Inside Group Info Modal */}
          {showParticipantActions && (
            <Modal
              visible={showParticipantActions}
              transparent
              animationType="fade"
              onRequestClose={closeParticipantActions}
            >
              <TouchableWithoutFeedback onPress={closeParticipantActions}>
                <View style={styles.participantActionsOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={[styles.participantActionsModal, { backgroundColor: theme.surface }]}>
                      <Text style={[styles.participantActionsTitle, { color: theme.text }]}>
                        {selectedParticipant?.name}
                      </Text>

                      {selectedParticipant && !selectedParticipant.isAdmin && (
                        <TouchableOpacity
                          style={[styles.participantActionOption, { borderBottomColor: theme.border }]}
                          onPress={handleMakeAdmin}
                          activeOpacity={0.7}
                        >
                          <Icon name="shield-checkmark-outline" size={22} color="#007AFF" style={styles.participantActionIcon} />
                          <Text style={[styles.participantActionText, { color: '#007AFF' }]}>Make group admin</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.participantActionOption, { borderBottomColor: theme.border }]}
                        onPress={handleRemoveParticipant}
                        activeOpacity={0.7}
                      >
                        <Icon name="person-remove-outline" size={22} color="#FF3B30" style={styles.participantActionIcon} />
                        <Text style={[styles.participantActionText, { color: '#FF3B30' }]}>Remove from group</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.participantActionCancel}
                        onPress={closeParticipantActions}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.participantActionCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}

          {/* Exit Group Modal - Inside Group Info Modal */}
          {showExitGroupModal && (
            <Modal
              visible={showExitGroupModal}
              transparent
              animationType="fade"
              onRequestClose={cancelExitGroup}
            >
              <TouchableWithoutFeedback onPress={cancelExitGroup}>
                <View style={styles.exitGroupOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={[styles.exitGroupModal, { backgroundColor: theme.surface }]}>
                      <Text style={[styles.exitGroupTitle, { color: theme.text }]}>
                        Exit Group
                      </Text>
                      <Text style={[styles.exitGroupMessage, { color: theme.textSecondary }]}>
                        Are you sure you want to exit this group?
                      </Text>

                      <TouchableOpacity
                        style={[styles.exitGroupOption, { borderBottomColor: theme.border }]}
                        onPress={confirmExitGroup}
                        activeOpacity={0.7}
                      >
                        <Icon name="exit-outline" size={22} color="#FF3B30" style={styles.exitGroupIcon} />
                        <Text style={[styles.exitGroupOptionText, { color: '#FF3B30' }]}>Exit Group</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.exitGroupCancel}
                        onPress={cancelExitGroup}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.exitGroupCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}
        </SafeAreaView>
      </Modal>

      {/* Message Info Modal */}
      <Modal
        visible={showMessageInfoModal}
        animationType="slide"
        onRequestClose={closeMessageInfo}
      >
        <SafeAreaView style={[styles.messageInfoContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.messageInfoHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={closeMessageInfo} style={styles.messageInfoBackButton}>
              <Icon name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.messageInfoTitle, { color: theme.text }]}>Message info</Text>
          </View>

          {/* Message Content */}
          {messageForInfo && (
            <ScrollView style={styles.messageInfoContent}>
              {/* Message Bubble */}
              <View style={styles.messageInfoBubbleContainer}>
                <View style={[styles.messageInfoBubble, { backgroundColor: theme.primary }]}>
                  <Text style={styles.messageInfoBubbleText}>{messageForInfo.content}</Text>
                  <Text style={styles.messageInfoBubbleTime}>
                    {new Date(messageForInfo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              {/* Read By Section */}
              <View style={styles.messageInfoSection}>
                <View style={styles.messageInfoSectionHeader}>
                  <Icon name="checkmark-done" size={18} color="#34B7F1" style={{ marginRight: 8 }} />
                  <Text style={[styles.messageInfoSectionTitle, { color: theme.textSecondary }]}>Read</Text>
                </View>
                {participants
                  .filter(p => p.id !== 'current')
                  .slice(0, 2)
                  .map((participant) => (
                    <View key={`read-${participant.id}`} style={[styles.messageInfoItem, { borderBottomColor: theme.border }]}>
                      <View style={styles.messageInfoItemLeft}>
                        <View style={[styles.messageInfoAvatar, { backgroundColor: theme.surfaceElevated }]}>
                          <Icon name="person" size={20} color={theme.textSecondary} />
                        </View>
                        <Text style={[styles.messageInfoItemName, { color: theme.text }]}>{participant.name}</Text>
                      </View>
                      <Text style={[styles.messageInfoItemTime, { color: theme.textSecondary }]}>
                        {new Date(messageForInfo.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  ))}
              </View>

              {/* Delivered Section */}
              <View style={styles.messageInfoSection}>
                <View style={styles.messageInfoSectionHeader}>
                  <Icon name="checkmark-done-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.messageInfoSectionTitle, { color: theme.textSecondary }]}>Delivered</Text>
                </View>
                {participants
                  .filter(p => p.id !== 'current')
                  .map((participant) => (
                    <View key={`delivered-${participant.id}`} style={[styles.messageInfoItem, { borderBottomColor: theme.border }]}>
                      <View style={styles.messageInfoItemLeft}>
                        <View style={[styles.messageInfoAvatar, { backgroundColor: theme.surfaceElevated }]}>
                          <Icon name="person" size={20} color={theme.textSecondary} />
                        </View>
                        <Text style={[styles.messageInfoItemName, { color: theme.text }]}>{participant.name}</Text>
                      </View>
                      <Text style={[styles.messageInfoItemTime, { color: theme.textSecondary }]}>
                        {new Date(messageForInfo.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

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
      <Modal
        visible={showContactModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowContactModal(false);
          setSelectedContacts([]);
          setContactSearch('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.contactModalContainer, { backgroundColor: theme.surface }]}>
            {/* Header */}
            <View style={[styles.contactModalHeader, { borderBottomColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => {
                  setShowContactModal(false);
                  setSelectedContacts([]);
                  setContactSearch('');
                }}
              >
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.contactModalTitle, { color: theme.text }]}>
                {selectedContacts.length > 0 ? `${selectedContacts.length} Selected` : 'Select Contact'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={[styles.contactSearchContainer, { backgroundColor: theme.background }]}>
              <Icon name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.contactSearchInput, { color: theme.text }]}
                placeholder="Search contacts..."
                placeholderTextColor={theme.textSecondary}
                value={contactSearch}
                onChangeText={setContactSearch}
              />
            </View>

            {/* Contact List */}
            <ScrollView style={styles.contactList}>
              {filteredContacts.map((contact) => {
                const isSelected = selectedContacts.some(c => c.id === contact.id);
                return (
                  <TouchableOpacity
                    key={contact.id}
                    style={[
                      styles.contactItem,
                      { borderBottomColor: theme.border },
                      isSelected && { backgroundColor: theme.border }
                    ]}
                    onPress={() => toggleContactSelection(contact)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.contactAvatar, { backgroundColor: theme.primary }]}>
                      <Text style={styles.contactAvatarText}>
                        {getInitials(contact.name)}
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, { color: theme.text }]}>
                        {contact.name}
                      </Text>
                      <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>
                        {contact.phone}
                      </Text>
                    </View>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={24} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Send Button */}
            {selectedContacts.length > 0 && (
              <View style={styles.contactModalFooter}>
                <TouchableOpacity
                  style={[styles.contactSendButton, { backgroundColor: theme.primary }]}
                  onPress={sendContacts}
                >
                  <Icon name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.contactSendButtonText}>
                    Send {selectedContacts.length} Contact{selectedContacts.length > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Attachment Menu Modal */}
      <AttachmentModal
        visible={showAttachmentMenu}
        onClose={closeAttachmentMenu}
        onSelectOption={handleAttachmentOption}
      />

      {/* Toast Notification */}
      {showToast && (
        <View style={styles.toastContainer}>
          <View style={[styles.toast, { backgroundColor: '#333333' }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}
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
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantCount: {
    fontSize: 12,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
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
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 6,
    borderRadius: 4,
  },
  replyPreviewSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreviewContent: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 4,
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
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
  },
  replyBarContent: {
    flex: 1,
    flexDirection: 'row',
  },
  replyBarAccent: {
    width: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  replyBarText: {
    flex: 1,
  },
  replyBarSender: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyBarMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  replyBarClose: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  attachButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsModal: {
    width: '80%',
    borderRadius: 12,
    padding: 8,
    maxWidth: 300,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  deleteModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
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
  groupInfoContainer: {
    flex: 1,
  },
  groupInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  groupInfoBackButton: {
    padding: 8,
    marginRight: 12,
  },
  groupInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  groupInfoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  groupIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupNameLarge: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 32,
  },
  groupCreated: {
    fontSize: 12,
  },
  participantsSection: {
    marginBottom: 16,
    paddingVertical: 16,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  adminBadge: {
    fontSize: 12,
    marginTop: 2,
  },
  groupActionsSection: {
    paddingVertical: 8,
    marginTop: 16,
  },
  groupAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  groupActionText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
  // Participant Actions Modal Styles
  participantActionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  participantActionsModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  participantActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  participantActionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  participantActionIcon: {
    marginRight: 16,
  },
  participantActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  participantActionCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  participantActionCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Exit Group Modal Styles
  exitGroupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  exitGroupModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  exitGroupTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  exitGroupMessage: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exitGroupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  exitGroupIcon: {
    marginRight: 16,
  },
  exitGroupOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  exitGroupCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  exitGroupCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Document Menu Styles
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
});

export default GroupChatScreen;
