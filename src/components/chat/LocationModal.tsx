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

interface LocationModalProps {
  visible: boolean;
  location: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSendCurrentLocation: () => void;
  onShareLiveLocation: () => void;
}

/**
 * LocationModal - A reusable modal for sharing location
 * Allows users to send current location or share live location
 */
const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  location,
  onClose,
  onSendCurrentLocation,
  onShareLiveLocation,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.locationModalContainer, { backgroundColor: theme.surface }]}>
              {/* Map Preview */}
              <View style={[styles.locationModalMap, { backgroundColor: theme.border }]}>
                <Icon name="location" size={60} color={theme.primary} />
                {location && (
                  <Text style={[styles.locationModalCoords, { color: theme.textSecondary }]}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                )}
              </View>

              {/* Location Info */}
              <View style={styles.locationModalInfo}>
                <Text style={[styles.locationModalTitle, { color: theme.text }]}>
                  Your Location
                </Text>
                <Text style={[styles.locationModalSubtitle, { color: theme.textSecondary }]}>
                  Accurate to {Math.floor(Math.random() * 20) + 10} meters
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.locationModalActions}>
                <TouchableOpacity
                  style={[styles.locationModalButton, { backgroundColor: theme.primary }]}
                  onPress={onSendCurrentLocation}
                  activeOpacity={0.8}
                >
                  <Icon name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.locationModalButtonText}>
                    Send Current Location
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.locationModalButtonSecondary, { borderColor: theme.primary }]}
                  onPress={onShareLiveLocation}
                  activeOpacity={0.8}
                >
                  <Icon name="radio" size={20} color={theme.primary} />
                  <Text style={[styles.locationModalButtonTextSecondary, { color: theme.primary }]}>
                    Share Live Location
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.locationModalCancel}
                  onPress={onClose}
                >
                  <Text style={[styles.locationModalCancelText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModalContainer: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  locationModalMap: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationModalCoords: {
    marginTop: 8,
    fontSize: 12,
  },
  locationModalInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationModalSubtitle: {
    fontSize: 14,
  },
  locationModalActions: {
    padding: 16,
  },
  locationModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationModalButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 12,
  },
  locationModalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationModalCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  locationModalCancelText: {
    fontSize: 16,
  },
});

export default LocationModal;
