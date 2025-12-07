import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Switch,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { ChatStackParamList } from '../../types';
import { Theme } from '../../constants/theme';

type UserProfileRouteProp = RouteProp<ChatStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<ChatStackParamList, 'UserProfile'>;

const UserProfileScreen = () => {
  const route = useRoute<UserProfileRouteProp>();
  const navigation = useNavigation<UserProfileNavigationProp>();
  const { theme } = useTheme();
  const { userId, userName, userPhone } = route.params;

  const [isMuted, setIsMuted] = useState(false);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  const [showEncryptionInfo, setShowEncryptionInfo] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);

  const handleMessage = () => {
    navigation.goBack();
  };

  const handleMuteToggle = () => {
    if (!isMuted) {
      setShowMuteOptions(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleMuteDuration = (duration: string) => {
    setIsMuted(true);
    setShowMuteOptions(false);
  };

  const handleEncryptionInfo = () => {
    setShowEncryptionInfo(true);
  };

  const handleBlockClick = () => {
    console.log('Block clicked, showing modal');
    setShowBlockModal(true);
  };

  const confirmBlock = () => {
    setShowBlockModal(false);
    navigation.goBack();
  };

  const handleReportClick = () => {
    setShowReportModal(true);
  };

  const confirmReport = () => {
    setShowReportModal(false);
    setShowReportSuccess(true);
  };

  const handleReportSuccessBlock = () => {
    setShowReportSuccess(false);
    setShowBlockModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Contact Info</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="ellipsis-vertical" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatarLarge, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarLargeText}>
              {userName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          <Text style={[styles.userPhone, { color: theme.textSecondary }]}>{userPhone}</Text>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMessage}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.primary }]}>
              <Icon name="chatbubble" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionLabel, { color: theme.text }]}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>About</Text>
          <View style={[styles.infoItem, { backgroundColor: theme.surface }]}>
            <Icon name="information-circle-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Hey there! I am using URGE.
            </Text>
          </View>
        </View>

        {/* Phone Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Phone</Text>
          <View style={[styles.infoItem, { backgroundColor: theme.surface }]}>
            <Icon name="call-outline" size={20} color={theme.textSecondary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoText, { color: theme.text }]}>{userPhone}</Text>
              <Text style={[styles.infoSubtext, { color: theme.textSecondary }]}>Mobile</Text>
            </View>
          </View>
        </View>

        {/* Media Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Media, Links, and Docs
            </Text>
            <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>0</Text>
          </View>
          <TouchableOpacity style={[styles.infoItem, { backgroundColor: theme.surface }]}>
            <View style={styles.mediaPreview}>
              <Icon name="image-outline" size={24} color={theme.textSecondary} />
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Mute Notifications */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.infoItem, { backgroundColor: theme.surface }]}
            onPress={handleMuteToggle}
          >
            <Icon
              name={isMuted ? 'notifications-off' : 'notifications-off-outline'}
              size={20}
              color={theme.textSecondary}
            />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Mute Notifications
            </Text>
            <Switch
              value={isMuted}
              onValueChange={handleMuteToggle}
              trackColor={{ false: theme.border, true: theme.primary + '50' }}
              thumbColor={isMuted ? theme.primary : theme.surfaceElevated}
            />
          </TouchableOpacity>
        </View>

        {/* Encryption */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.infoItem, { backgroundColor: theme.surface }]}
            onPress={handleEncryptionInfo}
          >
            <Icon name="lock-closed-outline" size={20} color={theme.textSecondary} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoText, { color: theme.text }]}>Encryption</Text>
              <Text style={[styles.infoSubtext, { color: theme.textSecondary }]}>
                Messages are end-to-end encrypted
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.infoItem, { backgroundColor: theme.surface }]}
            onPress={handleBlockClick}
          >
            <Icon name="ban-outline" size={20} color={theme.error} />
            <Text style={[styles.infoText, { color: theme.error }]}>Block {userName}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.infoItem, { backgroundColor: theme.surface }]}
            onPress={handleReportClick}
          >
            <Icon name="alert-circle-outline" size={20} color={theme.error} />
            <Text style={[styles.infoText, { color: theme.error }]}>Report {userName}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Mute Options Modal */}
      <Modal
        visible={showMuteOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMuteOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMuteOptions(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Mute notifications</Text>

                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: theme.border }]}
                  onPress={() => handleMuteDuration('8 hours')}
                >
                  <Text style={[styles.modalOptionText, { color: theme.text }]}>8 hours</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: theme.border }]}
                  onPress={() => handleMuteDuration('1 week')}
                >
                  <Text style={[styles.modalOptionText, { color: theme.text }]}>1 week</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleMuteDuration('Always')}
                >
                  <Text style={[styles.modalOptionText, { color: theme.text }]}>Always</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalCancel, { backgroundColor: theme.background }]}
                  onPress={() => setShowMuteOptions(false)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Encryption Info Modal */}
      <Modal
        visible={showEncryptionInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEncryptionInfo(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEncryptionInfo(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.encryptionModal, { backgroundColor: theme.surface }]}>
                <View style={[styles.encryptionIconContainer, { backgroundColor: theme.primary + '20' }]}>
                  <Icon name="lock-closed" size={40} color={theme.primary} />
                </View>

                <Text style={[styles.encryptionTitle, { color: theme.text }]}>
                  End-to-end encryption
                </Text>

                <Text style={[styles.encryptionDescription, { color: theme.textSecondary }]}>
                  Messages and calls are end-to-end encrypted. No one outside of this chat, not even URGE, can read or listen to them.
                </Text>

                <Text style={[styles.encryptionDescription, { color: theme.textSecondary }]}>
                  Your personal messages are protected with locks and only you and the recipient have the special keys to unlock and read them.
                </Text>

                <TouchableOpacity
                  style={[styles.encryptionButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowEncryptionInfo(false)}
                >
                  <Text style={styles.encryptionButtonText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Block Confirmation Modal */}
      {console.log('showBlockModal:', showBlockModal)}
      <Modal
        visible={showBlockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowBlockModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmModal, { backgroundColor: theme.surface }]}>
                <Text style={[styles.confirmTitle, { color: theme.text }]}>
                  Block {userName}?
                </Text>
                <Text style={[styles.confirmMessage, { color: theme.textSecondary }]}>
                  Blocked contacts will no longer be able to call you or send you messages.
                </Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonLeft]}
                    onPress={() => setShowBlockModal(false)}
                  >
                    <Text style={[styles.confirmButtonText, { color: theme.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonRight]}
                    onPress={confirmBlock}
                  >
                    <Text style={[styles.confirmButtonText, { color: theme.error }]}>Block</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Report Confirmation Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReportModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmModal, { backgroundColor: theme.surface }]}>
                <Text style={[styles.confirmTitle, { color: theme.text }]}>
                  Report {userName}?
                </Text>
                <Text style={[styles.confirmMessage, { color: theme.textSecondary }]}>
                  The last 5 messages from this contact will be forwarded to URGE. This contact will not be notified.
                </Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonLeft]}
                    onPress={() => setShowReportModal(false)}
                  >
                    <Text style={[styles.confirmButtonText, { color: theme.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonRight]}
                    onPress={confirmReport}
                  >
                    <Text style={[styles.confirmButtonText, { color: theme.error }]}>Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Report Success Modal */}
      <Modal
        visible={showReportSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportSuccess(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReportSuccess(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmModal, { backgroundColor: theme.surface }]}>
                <Text style={[styles.confirmTitle, { color: theme.text }]}>
                  Report Submitted
                </Text>
                <Text style={[styles.confirmMessage, { color: theme.textSecondary }]}>
                  {userName} has been reported. Thank you for helping us keep URGE safe.
                </Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonLeft]}
                    onPress={() => setShowReportSuccess(false)}
                  >
                    <Text style={[styles.confirmButtonText, { color: theme.primary }]}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmButtonRight]}
                    onPress={handleReportSuccessBlock}
                  >
                    <Text style={[styles.confirmButtonText, { color: theme.error }]}>Block Contact</Text>
                  </TouchableOpacity>
                </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginBottom: 8,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionCount: {
    fontSize: 13,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  infoSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  mediaPreview: {
    flex: 1,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 14,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalCancel: {
    paddingVertical: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  encryptionModal: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  encryptionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  encryptionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  encryptionDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  encryptionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  encryptionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmModal: {
    width: '80%',
    maxWidth: 340,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  confirmMessage: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    lineHeight: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(60, 60, 67, 0.29)',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonLeft: {
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(60, 60, 67, 0.29)',
  },
  confirmButtonRight: {},
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
});

export default UserProfileScreen;
