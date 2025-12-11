import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { useNavigation } from '@react-navigation/native';
import { userService, mediaService } from '../../services/api';

const EditProfileScreen = () => {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const { showModal, showSuccess, showError, showConfirm } = useModal();
  const navigation = useNavigation();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [instagram, setInstagram] = useState(user?.socialLinks?.instagram || '');
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter || '');
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || '');
  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar || null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImagePicker = () => {
    showConfirm(
      'Change Profile Photo',
      'Choose an option',
      () => {
        // Camera option
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
      },
      () => {
        // Gallery option - this will run on cancel, but we'll override
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
      }
    );
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
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
        setProfileImage(asset.uri);
        setNewImageUri(asset.uri);
        showSuccess('Success', 'Profile photo updated! Don\'t forget to save.');
      }
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      showError('Error', 'Display name is required');
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = profileImage;

      // Upload new profile image if changed
      if (newImageUri) {
        try {
          const uploadResponse = await mediaService.uploadImage(newImageUri, 'avatar');
          if (uploadResponse.success && uploadResponse.data?.url) {
            avatarUrl = uploadResponse.data.url;
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          // Continue with save even if image upload fails
        }
      }

      // Prepare profile data for backend (snake_case)
      const profileData = {
        display_name: displayName.trim(),
        email: email.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        social_links: {
          instagram: instagram.trim() || null,
          twitter: twitter.trim() || null,
          linkedin: linkedin.trim() || null,
        },
      };

      // Save to backend API
      const response = await userService.updateProfile(profileData);

      if (response.success) {
        // Also update local state
        await updateUser({
          displayName: displayName.trim(),
          email: email.trim() || undefined,
          bio: bio.trim() || undefined,
          avatar: avatarUrl || undefined,
          socialLinks: {
            instagram: instagram.trim() || undefined,
            twitter: twitter.trim() || undefined,
            linkedin: linkedin.trim() || undefined,
          },
        });

        showSuccess('Success', 'Profile updated successfully', () => {
          navigation.goBack();
        });
      } else {
        showError('Error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      showError('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.saveButtonText, { color: theme.primary }]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
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
            </View>
            <TouchableOpacity
              style={[styles.changePhotoButton, { backgroundColor: theme.primary }]}
              activeOpacity={0.7}
              onPress={handleImagePicker}
            >
              <Icon name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              BASIC INFORMATION
            </Text>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Icon name="person-outline" size={20} color={theme.primary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display Name"
                placeholderTextColor={theme.textTertiary}
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Icon name="mail-outline" size={20} color={theme.primary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email (optional)"
                placeholderTextColor={theme.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Icon name="call-outline" size={20} color={theme.textTertiary} />
              <TextInput
                style={[styles.input, { color: theme.textTertiary }]}
                value={user?.phoneNumber}
                editable={false}
                placeholder="Phone Number"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              ABOUT
            </Text>

            <View
              style={[
                styles.bioContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Icon
                name="document-text-outline"
                size={20}
                color={theme.primary}
                style={styles.bioIcon}
              />
              <TextInput
                style={[styles.bioInput, { color: theme.text }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Add a bio..."
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>
            <Text style={[styles.characterCount, { color: theme.textTertiary }]}>
              {bio.length}/200
            </Text>
          </View>

          {/* Social Links Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              SOCIAL LINKS
            </Text>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Icon name="logo-instagram" size={20} color={theme.primary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={instagram}
                onChangeText={setInstagram}
                placeholder="Instagram username"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="none"
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Icon name="logo-twitter" size={20} color={theme.primary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={twitter}
                onChangeText={setTwitter}
                placeholder="Twitter username"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="none"
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Icon name="logo-linkedin" size={20} color={theme.primary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={linkedin}
                onChangeText={setLinkedin}
                placeholder="LinkedIn username"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="none"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 70,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    width: 70,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  bioContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minHeight: 120,
  },
  bioIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  bioInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});

export default EditProfileScreen;
