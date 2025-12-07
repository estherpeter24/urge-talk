import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

const SplashScreen = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.logo, { color: theme.primary }]}>URGE</Text>
      <Text style={[styles.tagline, { color: theme.textSecondary }]}>
        Connect with your community
      </Text>
      <ActivityIndicator
        size="large"
        color={theme.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: Theme.fontSize.xxxl * 2,
    fontWeight: '700',
    marginBottom: Theme.spacing.md,
  },
  tagline: {
    fontSize: Theme.fontSize.lg,
    marginBottom: Theme.spacing.xl,
  },
  loader: {
    marginTop: Theme.spacing.xl,
  },
});

export default SplashScreen;
