import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface CustomModalProps {
  visible: boolean;
  type?: ModalType;
  title: string;
  message: string;
  primaryButton?: {
    text: string;
    onPress: () => void | Promise<void>;
    variant?: 'primary' | 'danger' | 'success';
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
  onClose?: () => void;
  icon?: string;
  autoClose?: number; // Auto close after X milliseconds
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  type = 'info',
  title,
  message,
  primaryButton,
  secondaryButton,
  onClose,
  icon,
  autoClose,
}) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoClose);
        return () => clearTimeout(timer);
      }
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, autoClose]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const getIconConfig = () => {
    if (icon) return { name: icon, color: theme.primary };

    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: theme.success };
      case 'error':
        return { name: 'close-circle', color: theme.error };
      case 'warning':
        return { name: 'warning', color: theme.warning };
      case 'confirm':
        return { name: 'help-circle', color: theme.info };
      default:
        return { name: 'information-circle', color: theme.info };
    }
  };

  const getButtonVariant = (variant?: 'primary' | 'danger' | 'success') => {
    switch (variant) {
      case 'danger':
        return theme.error;
      case 'success':
        return theme.success;
      default:
        return theme.primary;
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: theme.surface,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Close Button */}
              {onClose && !primaryButton && !secondaryButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={24} color={theme.textTertiary} />
                </TouchableOpacity>
              )}

              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${iconConfig.color}15` },
                ]}
              >
                <Icon name={iconConfig.name} size={48} color={iconConfig.color} />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

              {/* Message */}
              <Text style={[styles.message, { color: theme.textSecondary }]}>
                {message}
              </Text>

              {/* Buttons */}
              {(primaryButton || secondaryButton) && (
                <View style={styles.buttonsContainer}>
                  {secondaryButton && (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.secondaryButton,
                        { borderColor: theme.border },
                      ]}
                      onPress={() => {
                        secondaryButton.onPress();
                        handleClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.secondaryButtonText, { color: theme.text }]}
                      >
                        {secondaryButton.text}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {primaryButton && (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.primaryButton,
                        {
                          backgroundColor: getButtonVariant(primaryButton.variant),
                        },
                      ]}
                      onPress={async () => {
                        await primaryButton.onPress();
                        handleClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.primaryButtonText}>
                        {primaryButton.text}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 60,
    maxWidth: 400,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default CustomModal;
