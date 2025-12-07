import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface ContactPickerModalProps {
  visible: boolean;
  contacts: Contact[];
  selectedContacts: Contact[];
  searchQuery: string;
  onClose: () => void;
  onSearchChange: (query: string) => void;
  onToggleContact: (contact: Contact) => void;
  onSendContacts: () => void;
}

/**
 * ContactPickerModal - A reusable modal for selecting and sending contacts
 * Supports search, multi-select, and sending selected contacts
 */
const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  visible,
  contacts,
  selectedContacts,
  searchQuery,
  onClose,
  onSearchChange,
  onToggleContact,
  onSendContacts,
}) => {
  const { theme } = useTheme();

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.contactModalContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.contactModalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.contactModalTitle, { color: theme.text }]}>
              {selectedContacts.length > 0
                ? `${selectedContacts.length} Selected`
                : 'Select Contact'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search Bar */}
          <View style={[styles.contactSearchContainer, { backgroundColor: theme.background }]}>
            <Icon name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.contactSearchInput, { color: theme.text }]}
              placeholder="Search contacts..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={onSearchChange}
            />
          </View>

          {/* Contact List */}
          <ScrollView style={styles.contactList}>
            {contacts.map((contact) => {
              const isSelected = selectedContacts.some(c => c.id === contact.id);
              return (
                <TouchableOpacity
                  key={contact.id}
                  style={[
                    styles.contactItem,
                    { borderBottomColor: theme.border },
                    isSelected && { backgroundColor: theme.border }
                  ]}
                  onPress={() => onToggleContact(contact)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.contactAvatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.contactAvatarText}>
                      {getInitials(contact.name)}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: theme.text }]}>
                      {contact.name}
                    </Text>
                    <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>
                      {contact.phone}
                    </Text>
                  </View>
                  {isSelected && (
                    <Icon name="checkmark-circle" size={24} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Send Button */}
          {selectedContacts.length > 0 && (
            <View style={styles.contactModalFooter}>
              <TouchableOpacity
                style={[styles.contactSendButton, { backgroundColor: theme.primary }]}
                onPress={onSendContacts}
              >
                <Icon name="send" size={20} color="#FFFFFF" />
                <Text style={styles.contactSendButtonText}>
                  Send {selectedContacts.length} Contact{selectedContacts.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  contactModalContainer: {
    width: '100%',
    height: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  contactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  contactModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  contactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contactSearchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  contactList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
  },
  contactModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  contactSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  contactSendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactPickerModal;
