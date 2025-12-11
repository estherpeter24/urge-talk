import React, { useEffect, useRef } from 'react';
import { NavigationContainer, LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/SplashScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';
import { RootStackParamList } from '../types';
import { pushNotificationService, NotificationData } from '../services/pushNotification';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking configuration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['urgetalk://', 'https://urgetalk.com', 'https://www.urgetalk.com'],
  config: {
    screens: {
      JoinGroup: {
        path: 'join/:inviteCode',
        parse: {
          inviteCode: (inviteCode: string) => inviteCode,
        },
      },
      Main: {
        screens: {
          Chats: {
            screens: {
              GroupChat: 'group/:groupId',
              ChatRoom: 'chat/:conversationId',
            },
          },
        },
      },
    },
  },
  // Custom function to get the initial URL
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    return url;
  },
  // Subscribe to URL events
  subscribe(listener) {
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    return () => {
      linkingSubscription.remove();
    };
  },
};

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Set up push notification navigation handler
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNotificationTap = (data: NotificationData) => {
      if (!navigationRef.current) return;

      switch (data.type) {
        case 'new_message':
          if (data.conversation_id) {
            // Navigate to the chat room
            navigationRef.current.navigate('Main', {
              screen: 'Chats',
              params: {
                screen: data.is_group === 'true' ? 'GroupChat' : 'ChatRoom',
                params: data.is_group === 'true'
                  ? { groupId: data.conversation_id }
                  : { conversationId: data.conversation_id },
              },
            } as any);
          }
          break;

        case 'incoming_call':
          // Handle incoming call navigation
          // This would typically open a call screen
          console.log('Incoming call notification tapped:', data);
          break;

        case 'group_invite':
          if (data.group_id) {
            // Navigate to group details or join screen
            navigationRef.current.navigate('Main', {
              screen: 'Groups',
              params: {
                screen: 'GroupDetails',
                params: { groupId: data.group_id },
              },
            } as any);
          }
          break;

        default:
          console.log('Unknown notification type:', data.type);
      }
    };

    pushNotificationService.setOnNotificationCallback(handleNotificationTap);

    return () => {
      pushNotificationService.setOnNotificationCallback(() => {});
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen
              name="JoinGroup"
              component={JoinGroupScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="JoinGroup"
              component={JoinGroupScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
