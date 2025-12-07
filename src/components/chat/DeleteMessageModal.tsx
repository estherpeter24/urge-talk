import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

interface DeleteMessageModalProps {
  visible: boolean;
  canDeleteForEveryone: boolean;
  onClose: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
}

/**
 * DeleteMessageModal - A reusable modal for deleting messages
 * Provides options to delete for me or delete for everyone (if eligible)
 */
const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  visible,
  canDeleteForEveryone,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.deleteModalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.deleteModal, { backgroundColor: theme.surface }]}>
              <Text style={[styles.deleteModalTitle, { color: theme.text }]}>Delete message?</Text>

              <TouchableOpacity
                style={[styles.deleteModalOption, { borderBottomColor: theme.border }]}
                onPress={onDeleteForMe}
                activeOpacity={0.7}
              >
                <Icon name="trash-outline" size={22} color={theme.text} style={styles.deleteModalIcon} />
                <Text style={[styles.deleteModalOptionText, { color: theme.text }]}>Delete for me</Text>
              </TouchableOpacity>

              {canDeleteForEveryone && (
                <TouchableOpacity
                  style={[styles.deleteModalOption, { borderBottomColor: theme.border }]}
                  onPress={onDeleteForEveryone}
                  activeOpacity={0.7}
                >
                  <Icon name="trash" size={22} color="#FF3B30" style={styles.deleteModalIcon} />
                  <Text style={[styles.deleteModalOptionText, { color: '#FF3B30' }]}>Delete for everyone</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.deleteModalCancel}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.deleteModalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  deleteModal: {
    borderRadius: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  deleteModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  deleteModalIcon: {
    marginRight: 16,
  },
  deleteModalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteModalCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DeleteMessageModal;
