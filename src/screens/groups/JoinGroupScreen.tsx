import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { groupService, Group } from '../../services/api/groupService';

type JoinGroupScreenRouteProp = RouteProp<{ JoinGroup: { inviteCode: string } }, 'JoinGroup'>;
type NavigationProp = NativeStackNavigationProp<any>;

const JoinGroupScreen = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<JoinGroupScreenRouteProp>();
  const { inviteCode } = route.params;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    loadGroupInfo();
  }, [inviteCode]);

  const loadGroupInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupService.getGroupByInvite(inviteCode);

      if (response.success && response.data) {
        setGroup(response.data.group || response.data);
        setIsMember(response.data.is_member || false);
      } else {
        setError('Invalid or expired invite link');
      }
    } catch (err: any) {
      console.error('Load group info error:', err);
      if (err.response?.status === 404) {
        setError('This invite link is invalid or has been disabled');
      } else {
        setError('Failed to load group information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to join this group',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('Auth'),
          },
        ]
      );
      return;
    }

    try {
      setJoining(true);
      const response = await groupService.joinByInvite(inviteCode);

      if (response.success) {
        Alert.alert(
          'Welcome!',
          `You've joined ${group?.name}`,
          [
            {
              text: 'Open Group',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Main',
                      state: {
                        routes: [
                          {
                            name: 'Chats',
                            state: {
                              routes: [
                                { name: 'ChatList' },
                                { name: 'GroupChat', params: { groupId: response.data?.group_id || group?.id } },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                });
              },
            },
          ]
        );
      }
    } catch (err: any) {
      console.error('Join group error:', err);
      if (err.response?.data?.detail) {
        Alert.alert('Error', err.response.data.detail);
      } else {
        Alert.alert('Error', 'Failed to join group');
      }
    } finally {
      setJoining(false);
    }
  };

  const handleGoToGroup = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            routes: [
              {
                name: 'Chats',
                state: {
                  routes: [
                    { name: 'ChatList' },
                    { name: 'GroupChat', params: { groupId: group?.id } },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  };

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading group info...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="link-outline" size={80} color={theme.textTertiary} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            Invalid Invite Link
          </Text>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadGroupInfo}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Icon name="close" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Group Avatar */}
        <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
          {group?.avatar_url ? (
            <Text style={styles.avatarText}>
              {(group.name || 'G').charAt(0).toUpperCase()}
            </Text>
          ) : (
            <Icon name="people" size={60} color="#FFFFFF" />
          )}
        </View>

        {/* Group Info */}
        <Text style={[styles.groupName, { color: theme.text }]}>
          {group?.name}
        </Text>

        {group?.description && (
          <Text style={[styles.groupDescription, { color: theme.textSecondary }]}>
            {group.description}
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={[styles.statBadge, { backgroundColor: theme.surfaceElevated }]}>
            <Icon name="people-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {group?.member_count || group?.members?.length || 0} members
            </Text>
          </View>
        </View>

        {/* Invite Message */}
        <View style={[styles.inviteCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <Icon name="mail-open-outline" size={24} color={theme.primary} />
          <Text style={[styles.inviteText, { color: theme.text }]}>
            You've been invited to join this group
          </Text>
        </View>

        {/* Action Buttons */}
        {isMember ? (
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: theme.primary }]}
            onPress={handleGoToGroup}
          >
            <Icon name="chatbubbles" size={20} color="#FFFFFF" />
            <Text style={styles.joinButtonText}>Open Group Chat</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: theme.primary }]}
            onPress={handleJoinGroup}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="enter-outline" size={20} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>Join Group</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: theme.border }]}
          onPress={handleClose}
        >
          <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
            {isMember ? 'Close' : 'Not Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupName: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
    gap: 12,
  },
  inviteText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 12,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JoinGroupScreen;
