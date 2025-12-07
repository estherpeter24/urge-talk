import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

interface AttachmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (type: string) => void;
}

const AttachmentModal: React.FC<AttachmentModalProps> = ({
  visible,
  onClose,
  onSelectOption,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const attachmentOptions = [
    {
      type: 'document',
      label: 'Document',
      icon: 'document-text',
      color: '#7F66FF',
    },
    {
      type: 'camera',
      label: 'Camera',
      icon: 'camera',
      color: '#FF6B9D',
    },
    {
      type: 'gallery',
      label: 'Gallery',
      icon: 'images',
      color: '#AC44CF',
    },
    {
      type: 'location',
      label: 'Location',
      icon: 'location',
      color: '#1DA85C',
    },
    {
      type: 'contact',
      label: 'Contact',
      icon: 'person',
      color: '#0092FF',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.attachmentMenu,
                { backgroundColor: theme.surface },
                {
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                  ],
                  opacity: slideAnim,
                },
              ]}
            >
              <View style={styles.attachmentGrid}>
                {/* Row 1: Document, Camera, Gallery */}
                {attachmentOptions.slice(0, 3).map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={styles.attachmentItem}
                    onPress={() => onSelectOption(option.type)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.attachmentIconContainer,
                        { backgroundColor: option.color },
                      ]}
                    >
                      <Icon name={option.icon} size={28} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.attachmentLabel, { color: theme.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.attachmentGrid}>
                {/* Row 2: Location, Contact */}
                {attachmentOptions.slice(3, 5).map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={styles.attachmentItem}
                    onPress={() => onSelectOption(option.type)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.attachmentIconContainer,
                        { backgroundColor: option.color },
                      ]}
                    >
                      <Icon name={option.icon} size={28} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.attachmentLabel, { color: theme.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
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
  attachmentMenu: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  attachmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  attachmentItem: {
    alignItems: 'center',
    width: 80,
  },
  attachmentIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  attachmentLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AttachmentModal;
