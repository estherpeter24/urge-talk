import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaystackProvider } from 'react-native-paystack-webview';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ModalProvider } from './src/context/ModalContext';
import { SocketProvider } from './src/context/SocketContext';
import RootNavigator from './src/navigation/RootNavigator';
import { PAYSTACK_PUBLIC_KEY } from './src/constants/config';

const AppContent = () => {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.statusBar}
      />
      <RootNavigator />
    </>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaystackProvider publicKey={PAYSTACK_PUBLIC_KEY} currency="NGN">
          <ThemeProvider>
            <ModalProvider>
              <AuthProvider>
                <SocketProvider>
                  <AppContent />
                </SocketProvider>
              </AuthProvider>
            </ModalProvider>
          </ThemeProvider>
        </PaystackProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
