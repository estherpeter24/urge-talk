import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../types';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';
import PrivacyScreen from '../screens/settings/PrivacyScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import TermsPrivacyScreen from '../screens/settings/TermsPrivacyScreen';
import LanguageScreen from '../screens/settings/LanguageScreen';
import SubscriptionsScreen from '../screens/settings/SubscriptionsScreen';
import VerificationScreen from '../screens/settings/VerificationScreen';
import SocialMediaScreen from '../screens/settings/SocialMediaScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="SocialMedia" component={SocialMediaScreen} />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
