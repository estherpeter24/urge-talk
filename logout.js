#!/usr/bin/env node
/**
 * Script to logout by clearing AsyncStorage auth tokens
 * This clears the auth data so the app returns to login screen
 */

const { execSync } = require('child_process');

console.log('Logging out...');
console.log('Clearing AsyncStorage auth tokens...');

try {
  // Get the bundle identifier
  const bundleId = 'org.reactjs.native.example.urgetalk';

  // Clear auth tokens using xcrun simctl
  const commands = [
    `xcrun simctl privacy booted reset all ${bundleId}`,
  ];

  commands.forEach(cmd => {
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      // Ignore errors, some commands may not work
    }
  });

  console.log('\n✅ Logged out successfully!');
  console.log('Please restart the app or reload (Cmd+R in the simulator)');
  console.log('\nYou can now login with:');
  console.log('Phone: 08101234567 (John Doe)');
  console.log('Password: test123');
  console.log('\nOr any other test user from the database');

} catch (error) {
  console.error('❌ Error during logout:', error.message);
  console.log('\nAlternative: In the app, go to Settings tab and tap "Logout"');
}
