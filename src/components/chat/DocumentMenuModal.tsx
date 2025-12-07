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

interface DocumentMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'document' | 'gallery' | 'camera') => void;
}

/**
 * DocumentMenuModal - A reusable modal for selecting document types
 * Used for choosing between document picker, gallery, or camera
 */
const DocumentMenuModal: React.FC<DocumentMenuModalProps> = ({
  visible,
  onClose,
  onSelectType,
}) => {
  const { theme } = useTheme();
  const docSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(docSlideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(docSlideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, docSlideAnim]);

  const documentOptions = [
    {
      type: 'document' as const,
      label: 'Document',
      icon: 'document-text',
      color: '#7F66FF',
    },
    {
      type: 'gallery' as const,
      label: 'Gallery',
      icon: 'images',
      color: '#AC44CF',
    },
    {
      type: 'camera' as const,
      label: 'Camera',
      icon: 'camera',
      color: '#FF6B9D',
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
                styles.documentMenu,
                { backgroundColor: theme.surface },
                {
                  transform: [
                    {
                      translateY: docSlideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                  ],
                  opacity: docSlideAnim,
                },
              ]}
            >
              <View style={styles.documentMenuHeader}>
                <Text style={[styles.documentMenuTitle, { color: theme.text }]}>
                  Select Document Type
                </Text>
              </View>

              {documentOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[styles.documentMenuItem, { borderBottomColor: theme.border }]}
                  onPress={() => onSelectType(option.type)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.documentIconContainer, { backgroundColor: option.color }]}>
                    <Icon name={option.icon} size={24} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.documentMenuItemText, { color: theme.text }]}>
                    {option.label}
                  </Text>
                  <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}
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
  documentMenu: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  documentMenuHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  documentMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  documentMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  documentIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentMenuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DocumentMenuModal;
