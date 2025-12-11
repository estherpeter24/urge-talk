import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatStackParamList } from '../types';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';
import NewChatScreen from '../screens/chat/NewChatScreen';
import GroupChatScreen from '../screens/chat/GroupChatScreen';
import GroupInfoScreen from '../screens/groups/GroupInfoScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import ArchivedChatsScreen from '../screens/chat/ArchivedChatsScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';

const Stack = createNativeStackNavigator<ChatStackParamList>();

const ChatNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={({ navigation }) => ({
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{
          title: 'New Chat',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
        options={{
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen
        name="GroupInfo"
        component={GroupInfoScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          title: 'Create Group',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen
        name="ArchivedChats"
        component={ArchivedChatsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default ChatNavigator;
