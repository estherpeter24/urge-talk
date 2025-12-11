/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Setup Firebase background message handler
// This MUST be at the top level, outside of any component
import { setupBackgroundHandler } from './src/services/pushNotification';
setupBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
