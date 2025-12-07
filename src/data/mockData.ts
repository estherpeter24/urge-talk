// Mock data for chats and messages

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  status: 'sent' | 'delivered' | 'read';
  attachmentUrl?: string;
}

export interface Chat {
  id: string;
  type: 'one-on-one' | 'group';
  name?: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
}

export interface GroupChat extends Chat {
  type: 'group';
  name: string;
  description: string;
  icon: string;
  admin: string[];
  createdAt: string;
}

// Mock Users
export const mockUsers: Record<string, User> = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    phoneNumber: '+1 234 567 8901',
    status: 'online',
  },
  '2': {
    id: '2',
    name: 'Michael Chen',
    phoneNumber: '+1 234 567 8902',
    status: 'online',
  },
  '3': {
    id: '3',
    name: 'Emma Williams',
    phoneNumber: '+1 234 567 8903',
    status: 'offline',
    lastSeen: '2 hours ago',
  },
  '4': {
    id: '4',
    name: 'James Rodriguez',
    phoneNumber: '+1 234 567 8904',
    status: 'away',
  },
  '5': {
    id: '5',
    name: 'Olivia Martinez',
    phoneNumber: '+1 234 567 8905',
    status: 'online',
  },
  '6': {
    id: '6',
    name: 'David Lee',
    phoneNumber: '+1 234 567 8906',
    status: 'offline',
    lastSeen: '1 day ago',
  },
  '7': {
    id: '7',
    name: 'Sophia Anderson',
    phoneNumber: '+1 234 567 8907',
    status: 'online',
  },
  '8': {
    id: '8',
    name: 'Daniel Brown',
    phoneNumber: '+1 234 567 8908',
    status: 'offline',
    lastSeen: '5 minutes ago',
  },
  '9': {
    id: '9',
    name: 'Isabella Garcia',
    phoneNumber: '+1 234 567 8909',
    status: 'online',
  },
  '10': {
    id: '10',
    name: 'Christopher Taylor',
    phoneNumber: '+1 234 567 8910',
    status: 'away',
  },
  'current': {
    id: 'current',
    name: 'You',
    phoneNumber: '+1 234 567 0000',
    status: 'online',
  },
};

// Mock Messages for One-on-One Chats
export const mockMessages: Record<string, Message[]> = {
  // Chat with Sarah Johnson
  'chat-1': [
    {
      id: 'msg-1-1',
      senderId: '1',
      text: "Hey! How are you doing?",
      timestamp: '2024-01-20T09:00:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-1-2',
      senderId: 'current',
      text: "I'm doing great! Thanks for asking. How about you?",
      timestamp: '2024-01-20T09:02:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-1-3',
      senderId: '1',
      text: "Pretty good! Just finished a great workout session.",
      timestamp: '2024-01-20T09:05:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-1-4',
      senderId: 'current',
      text: "That's awesome! What kind of workout?",
      timestamp: '2024-01-20T09:07:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-1-5',
      senderId: '1',
      text: "Cardio and some weight training. Feeling pumped! 💪",
      timestamp: '2024-01-20T09:10:00Z',
      type: 'text',
      status: 'delivered',
    },
  ],
  // Chat with Michael Chen
  'chat-2': [
    {
      id: 'msg-2-1',
      senderId: '2',
      text: "Did you see the game last night?",
      timestamp: '2024-01-20T08:30:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-2-2',
      senderId: 'current',
      text: "Yes! It was incredible! That final shot was insane! 🏀",
      timestamp: '2024-01-20T08:32:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-2-3',
      senderId: '2',
      text: "I know right! Best game of the season so far",
      timestamp: '2024-01-20T08:35:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-2-4',
      senderId: 'current',
      text: "Are you going to watch the next one?",
      timestamp: '2024-01-20T08:37:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-2-5',
      senderId: '2',
      text: "Definitely! Want to come over and watch it together?",
      timestamp: '2024-01-20T08:40:00Z',
      type: 'text',
      status: 'delivered',
    },
  ],
  // Chat with Emma Williams
  'chat-3': [
    {
      id: 'msg-3-1',
      senderId: 'current',
      text: "Hi Emma! Do you have the notes from yesterday's meeting?",
      timestamp: '2024-01-20T10:15:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-3-2',
      senderId: '3',
      text: "Yes! Let me send them to you",
      timestamp: '2024-01-20T10:20:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-3-3',
      senderId: '3',
      text: "Here you go 📄",
      timestamp: '2024-01-20T10:21:00Z',
      type: 'file',
      status: 'read',
      attachmentUrl: 'meeting-notes.pdf',
    },
    {
      id: 'msg-3-4',
      senderId: 'current',
      text: "Thanks so much! You're a lifesaver! 🙏",
      timestamp: '2024-01-20T10:23:00Z',
      type: 'text',
      status: 'delivered',
    },
  ],
  // Chat with James Rodriguez
  'chat-4': [
    {
      id: 'msg-4-1',
      senderId: '4',
      text: "What time is the party tonight?",
      timestamp: '2024-01-20T07:00:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-4-2',
      senderId: 'current',
      text: "It starts at 8 PM! Don't be late 🎉",
      timestamp: '2024-01-20T07:05:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-4-3',
      senderId: '4',
      text: "Cool! Should I bring anything?",
      timestamp: '2024-01-20T07:10:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-4-4',
      senderId: 'current',
      text: "Maybe some drinks if you can!",
      timestamp: '2024-01-20T07:12:00Z',
      type: 'text',
      status: 'sent',
    },
  ],
  // Chat with Olivia Martinez
  'chat-5': [
    {
      id: 'msg-5-1',
      senderId: '5',
      text: "Check out this recipe I found! 🍝",
      timestamp: '2024-01-19T19:30:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-5-2',
      senderId: '5',
      text: "I'm going to try making it this weekend",
      timestamp: '2024-01-19T19:32:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'msg-5-3',
      senderId: 'current',
      text: "That looks delicious! Let me know how it turns out!",
      timestamp: '2024-01-19T19:35:00Z',
      type: 'text',
      status: 'delivered',
    },
  ],
};

// Mock Messages for Group Chats
export const mockGroupMessages: Record<string, Message[]> = {
  // Family Chat
  'group-1': [
    {
      id: 'gmsg-1-1',
      senderId: '1',
      text: "Morning everyone! ☀️",
      timestamp: '2024-01-20T08:00:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-1-2',
      senderId: '3',
      text: "Good morning! 😊",
      timestamp: '2024-01-20T08:05:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-1-3',
      senderId: 'current',
      text: "Morning! What's everyone up to today?",
      timestamp: '2024-01-20T08:10:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-1-4',
      senderId: '6',
      text: "I'm planning to visit grandma this afternoon",
      timestamp: '2024-01-20T08:12:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-1-5',
      senderId: '1',
      text: "That's wonderful! Give her my love ❤️",
      timestamp: '2024-01-20T08:15:00Z',
      type: 'text',
      status: 'delivered',
    },
  ],
  // Work Team
  'group-2': [
    {
      id: 'gmsg-2-1',
      senderId: '2',
      text: "Quick reminder: Team meeting in 30 minutes",
      timestamp: '2024-01-20T09:30:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-2-2',
      senderId: '4',
      text: "Thanks for the reminder! I'll be there",
      timestamp: '2024-01-20T09:32:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-2-3',
      senderId: '7',
      text: "What's the agenda?",
      timestamp: '2024-01-20T09:35:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-2-4',
      senderId: '2',
      text: "Q1 planning and project updates",
      timestamp: '2024-01-20T09:37:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-2-5',
      senderId: 'current',
      text: "Perfect! See you all soon 👍",
      timestamp: '2024-01-20T09:40:00Z',
      type: 'text',
      status: 'delivered',
    },
  ],
  // Friends Forever
  'group-3': [
    {
      id: 'gmsg-3-1',
      senderId: '5',
      text: "Who's up for movies this weekend? 🎬",
      timestamp: '2024-01-20T11:00:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-3-2',
      senderId: '8',
      text: "I'm in! What are we watching?",
      timestamp: '2024-01-20T11:05:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-3-3',
      senderId: '9',
      text: "Count me in too!",
      timestamp: '2024-01-20T11:07:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-3-4',
      senderId: 'current',
      text: "There's that new action movie that just came out",
      timestamp: '2024-01-20T11:10:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-3-5',
      senderId: '5',
      text: "Perfect! Let's go for the 7 PM show on Saturday",
      timestamp: '2024-01-20T11:15:00Z',
      type: 'text',
      status: 'delivered',
    },
  ],
  // Book Club
  'group-4': [
    {
      id: 'gmsg-4-1',
      senderId: '10',
      text: "Finished chapter 5! This book is getting intense 📚",
      timestamp: '2024-01-20T14:00:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-4-2',
      senderId: '3',
      text: "Right?! I couldn't put it down last night",
      timestamp: '2024-01-20T14:05:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-4-3',
      senderId: 'current',
      text: "No spoilers please! I'm only on chapter 3 😅",
      timestamp: '2024-01-20T14:10:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-4-4',
      senderId: '10',
      text: "Don't worry, lips are sealed! 🤐",
      timestamp: '2024-01-20T14:12:00Z',
      type: 'text',
      status: 'delivered',
    },
  ],
  // Gym Buddies
  'group-5': [
    {
      id: 'gmsg-5-1',
      senderId: '1',
      text: "Morning workout tomorrow at 6 AM?",
      timestamp: '2024-01-20T16:00:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-5-2',
      senderId: '4',
      text: "That's too early for me 😴",
      timestamp: '2024-01-20T16:05:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-5-3',
      senderId: '7',
      text: "I'm down! Let's do it 💪",
      timestamp: '2024-01-20T16:07:00Z',
      type: 'text',
      status: 'read',
    },
    {
      id: 'gmsg-5-4',
      senderId: 'current',
      text: "Count me in too!",
      timestamp: '2024-01-20T16:10:00Z',
      type: 'text',
      status: 'delivered',
    },
  ],
};

// Mock One-on-One Chats
export const mockOneOnOneChats: Chat[] = [
  {
    id: 'chat-1',
    type: 'one-on-one',
    participants: ['current', '1'],
    lastMessage: {
      id: 'msg-1-5',
      senderId: '1',
      text: "Cardio and some weight training. Feeling pumped! 💪",
      timestamp: '2024-01-20T09:10:00Z',
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 1,
    isPinned: true,
    isMuted: false,
  },
  {
    id: 'chat-2',
    type: 'one-on-one',
    participants: ['current', '2'],
    lastMessage: {
      id: 'msg-2-5',
      senderId: '2',
      text: "Definitely! Want to come over and watch it together?",
      timestamp: '2024-01-20T08:40:00Z',
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 1,
    isPinned: true,
    isMuted: false,
  },
  {
    id: 'chat-3',
    type: 'one-on-one',
    participants: ['current', '3'],
    lastMessage: {
      id: 'msg-3-4',
      senderId: 'current',
      text: "Thanks so much! You're a lifesaver! 🙏",
      timestamp: '2024-01-20T10:23:00Z',
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
  },
  {
    id: 'chat-4',
    type: 'one-on-one',
    participants: ['current', '4'],
    lastMessage: {
      id: 'msg-4-4',
      senderId: 'current',
      text: "Maybe some drinks if you can!",
      timestamp: '2024-01-20T07:12:00Z',
      type: 'text',
      status: 'sent',
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
  },
  {
    id: 'chat-5',
    type: 'one-on-one',
    participants: ['current', '5'],
    lastMessage: {
      id: 'msg-5-3',
      senderId: 'current',
      text: "That looks delicious! Let me know how it turns out!",
      timestamp: '2024-01-19T19:35:00Z',
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
  },
  {
    id: 'chat-6',
    type: 'one-on-one',
    participants: ['current', '6'],
    lastMessage: {
      id: 'msg-6-1',
      senderId: '6',
      text: "Thanks for your help today!",
      timestamp: '2024-01-19T18:00:00Z',
      type: 'text',
      status: 'read',
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: true,
  },
  {
    id: 'chat-7',
    type: 'one-on-one',
    participants: ['current', '7'],
    lastMessage: {
      id: 'msg-7-1',
      senderId: 'current',
      text: "See you tomorrow!",
      timestamp: '2024-01-19T17:30:00Z',
      type: 'text',
      status: 'read',
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
  },
];

// Mock Group Chats
export const mockGroupChats: GroupChat[] = [
  {
    id: 'group-1',
    type: 'group',
    name: 'Family Chat',
    description: 'Our lovely family',
    icon: 'home',
    participants: ['current', '1', '3', '6'],
    admin: ['1'],
    createdAt: '2023-12-01T00:00:00Z',
    lastMessage: {
      id: 'gmsg-1-5',
      senderId: '1',
      text: "That's wonderful! Give her my love ❤️",
      timestamp: '2024-01-20T08:15:00Z',
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 2,
    isPinned: true,
    isMuted: false,
  },
  {
    id: 'group-2',
    type: 'group',
    name: 'Work Team',
    description: 'Project discussions and updates',
    icon: 'briefcase',
    participants: ['current', '2', '4', '7', '10'],
    admin: ['2', '7'],
    createdAt: '2024-01-01T00:00:00Z',
    lastMessage: {
      id: 'gmsg-2-5',
      senderId: 'current',
      text: "Perfect! See you all soon 👍",
      timestamp: '2024-01-20T09:40:00Z',
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 5,
    isPinned: true,
    isMuted: false,
  },
  {
    id: 'group-3',
    type: 'group',
    name: 'Friends Forever',
    description: 'The squad ✌️',
    icon: 'people',
    participants: ['current', '5', '8', '9'],
    admin: ['current'],
    createdAt: '2023-11-15T00:00:00Z',
    lastMessage: {
      id: 'gmsg-3-5',
      senderId: '5',
      text: "Perfect! Let's go for the 7 PM show on Saturday",
      timestamp: '2024-01-20T11:15:00Z',
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
  },
  {
    id: 'group-4',
    type: 'group',
    name: 'Book Club',
    description: 'Monthly book discussions',
    icon: 'book',
    participants: ['current', '3', '6', '10'],
    admin: ['10'],
    createdAt: '2024-01-10T00:00:00Z',
    lastMessage: {
      id: 'gmsg-4-4',
      senderId: '10',
      text: "Don't worry, lips are sealed! 🤐",
      timestamp: '2024-01-20T14:12:00Z',
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 3,
    isPinned: false,
    isMuted: false,
  },
  {
    id: 'group-5',
    type: 'group',
    name: 'Gym Buddies',
    description: 'Fitness motivation group',
    icon: 'fitness',
    participants: ['current', '1', '4', '7'],
    admin: ['1'],
    createdAt: '2023-12-20T00:00:00Z',
    lastMessage: {
      id: 'gmsg-5-4',
      senderId: 'current',
      text: "Count me in too!",
      timestamp: '2024-01-20T16:10:00Z',
      type: 'text',
      status: 'delivered',
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: true,
  },
];

// Helper function to get user by ID
export const getUserById = (userId: string): User | undefined => {
  return mockUsers[userId];
};

// Helper function to get messages for a chat
export const getMessagesForChat = (chatId: string): Message[] => {
  return mockMessages[chatId] || mockGroupMessages[chatId] || [];
};

// Helper function to get all chats (both one-on-one and group)
export const getAllChats = (): (Chat | GroupChat)[] => {
  return [...mockOneOnOneChats, ...mockGroupChats].sort((a, b) => {
    const timeA = new Date(a.lastMessage.timestamp).getTime();
    const timeB = new Date(b.lastMessage.timestamp).getTime();
    return timeB - timeA; // Sort by most recent first
  });
};

// Helper function to format timestamp
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
