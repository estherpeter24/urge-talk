import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { conversationService, mediaService, userService } from '../../services/api';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

interface UserStats {
  totalChats: number;
  totalGroups: number;
  totalMessages: number;
}

const ProfileScreen = () => {
  const { theme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const { showModal, showConfirm, showSuccess, showError } = useModal();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar || null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [stats, setStats] = useState<UserStats>({ totalChats: 0, totalGroups: 0, totalMessages: 0 });

  useFocusEffect(
    React.useCallback(() => {
      loadUserStats();
    }, [])
  );

  const loadUserStats = async () => {
    try {
      setStatsLoading(true);
      const response = await conversationService.getConversations();

      if (response.success && response.data) {
        // response.data is ConversationListResponse, which has a conversations array
        const conversations = response.data.conversations || [];
        const totalChats = conversations.filter(c => c.type === 'DIRECT').length;
        const totalGroups = conversations.filter(c => c.type === 'GROUP').length;

        // Count total unread messages from all conversations
        const totalMessages = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

        setStats({
          totalChats,
          totalGroups,
          totalMessages,
        });
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
      // Keep stats at 0 if failed
    } finally {
      setStatsLoading(false);
    }
  };

  const handleImagePicker = () => {
    setShowImageOptions(true);
  };

  const handleTakePhoto = () => {
    setShowImageOptions(false);
    setTimeout(() => {
      launchCamera(
        {
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 500,
          maxHeight: 500,
          includeBase64: false,
        },
        handleImageResponse
      );
    }, 300);
  };

  const handleChooseFromGallery = () => {
    setShowImageOptions(false);
    setTimeout(() => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 500,
          maxHeight: 500,
          includeBase64: false,
        },
        handleImageResponse
      );
    }, 300);
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      showError('Error', response.errorMessage || 'Failed to pick image');
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      if (asset.uri) {
        // Show the image locally immediately for better UX
        setProfileImage(asset.uri);
        setUploadingImage(true);

        try {
          // Upload image to server
          const uploadResult = await mediaService.uploadImage(asset.uri, 'avatar');

          if (uploadResult.success && uploadResult.data?.url) {
            // Update user profile with new avatar URL
            const updateResult = await userService.updateProfile({
              avatar: uploadResult.data.url,
            });

            if (updateResult.success) {
              // Update local user state
              if (updateUser) {
                updateUser({ avatar: uploadResult.data.url });
              }
              showSuccess('Success', 'Profile photo updated!');
            } else {
              // Revert to previous image on failure
              setProfileImage(user?.avatar || null);
              showError('Error', updateResult.message || 'Failed to update profile');
            }
          } else {
            // Revert to previous image on upload failure
            setProfileImage(user?.avatar || null);
            showError('Error', uploadResult.message || 'Failed to upload image');
          }
        } catch (error: any) {
          // Revert to previous image on error
          setProfileImage(user?.avatar || null);
          showError('Error', error.message || 'Failed to update profile photo');
        } finally {
          setUploadingImage(false);
        }
      }
    }
  };

  const handleLogout = () => {
    showConfirm(
      'Logout',
      'Are you sure you want to logout?',
      async () => {
        setLoading(true);
        try {
          await logout();
          showSuccess('Logged Out', 'You have been successfully logged out');
        } catch (error) {
          console.error('Logout error:', error);
          showError('Error', 'Failed to logout. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const profileOptions = [
    {
      id: 'edit',
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => {
        const parentNav = navigation.getParent();
        if (parentNav) {
          parentNav.navigate('Settings', { screen: 'Notifications' });
        }
      },
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: 'shield-checkmark-outline',
      onPress: () => {
        const parentNav = navigation.getParent();
        if (parentNav) {
          parentNav.navigate('Settings', { screen: 'Privacy' });
        }
      },
    },
    {
      id: 'storage',
      title: 'Storage & Data',
      icon: 'server-outline',
      onPress: () => {
        showConfirm(
          'Storage & Data',
          'Clear app cache to free up space?\n\nCurrent cache: ~12.5 MB',
          () => {
            showSuccess('Success', 'Cache cleared successfully');
          }
        );
      },
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => {
        showModal({
          type: 'info',
          title: 'Help & Support',
          message: 'Need help?\n\nEmail: support@urge.chat\nWebsite: www.urge.chat/help\n\nWe typically respond within 24 hours.',
          primaryButton: {
            text: 'OK',
            onPress: () => {},
          },
        });
      },
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => {
        showModal({
          type: 'info',
          title: 'About URGE',
          message: 'Version: 1.0.0\nBuild: 2025.01\n\nURGE is a secure messaging platform designed for privacy-focused communication.\n\n© 2025 URGE. All rights reserved.',
          primaryButton: {
            text: 'OK',
            onPress: () => {},
          },
        });
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          </View>

          {/* Profile Card */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                  },
                ]}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <Icon name="person" size={50} color={theme.primary} />
                )}
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[styles.editAvatarButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.7}
                onPress={handleImagePicker}
                disabled={uploadingImage}
              >
                <Icon name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.displayName || 'User Name'}
            </Text>
            <Text style={[styles.userPhone, { color: theme.textSecondary }]}>
              {user?.phoneNumber || '+1 234 567 8900'}
            </Text>

            <View
              style={[
                styles.statsContainer,
                {
                  borderTopColor: theme.border,
                },
              ]}
            >
              {statsLoading ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ paddingVertical: 20 }} />
              ) : (
                <>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.text }]}>{stats.totalChats}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Chats
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.text }]}>{stats.totalGroups}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Groups
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.text }]}>{stats.totalMessages}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Unread
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Options List */}
          <View
            style={[
              styles.optionsContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            {profileOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  index === profileOptions.length - 1 && styles.optionItemLast,
                  {
                    borderBottomColor: theme.border,
                  },
                ]}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.optionIconContainer,
                    { backgroundColor: theme.surfaceElevated },
                  ]}
                >
                  <Icon name={option.icon} size={22} color={theme.primary} />
                </View>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  {option.title}
                </Text>
                <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              loading && styles.logoutButtonDisabled,
              {
                backgroundColor: theme.surface,
                borderColor: theme.error,
              },
            ]}
            onPress={handleLogout}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Icon name="log-out-outline" size={22} color={theme.error} />
            <Text style={[styles.logoutText, { color: theme.error }]}>
              {loading ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={[styles.versionText, { color: theme.textTertiary }]}>
            Version 1.0.0
          </Text>
        </ScrollView>
      </View>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowImageOptions(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.imageOptionsModal, { backgroundColor: theme.surface }]}>
                <View style={[styles.imageOptionsHeader, { borderBottomColor: theme.border }]}>
                  <Icon name="camera" size={24} color={theme.primary} />
                  <Text style={[styles.imageOptionsTitle, { color: theme.text }]}>
                    Change Profile Photo
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.imageOption, { borderBottomColor: theme.border }]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <Icon name="camera-outline" size={22} color={theme.text} />
                  <Text style={[styles.imageOptionText, { color: theme.text }]}>
                    Take Photo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.imageOption, { borderBottomColor: theme.border }]}
                  onPress={handleChooseFromGallery}
                  activeOpacity={0.7}
                >
                  <Icon name="images-outline" size={22} color={theme.text} />
                  <Text style={[styles.imageOptionText, { color: theme.text }]}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageOptionCancel}
                  onPress={() => setShowImageOptions(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.imageOptionCancelText, { color: theme.error }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  profileCard: {
    borderRadius: 20,
    marginHorizontal: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  userPhone: {
    fontSize: 15,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  optionsContainer: {
    borderRadius: 20,
    marginHorizontal: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginHorizontal: 24,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  imageOptionsModal: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: 400,
  },
  imageOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  imageOptionsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  imageOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageOptionCancel: {
    padding: 16,
    alignItems: 'center',
  },
  imageOptionCancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;
