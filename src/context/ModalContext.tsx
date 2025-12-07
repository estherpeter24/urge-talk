import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomModal, { CustomModalProps, ModalType } from '../components/common/CustomModal';

interface ShowModalParams {
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
  icon?: string;
  autoClose?: number;
}

interface ModalContextType {
  showModal: (params: ShowModalParams) => void;
  hideModal: () => void;
  showSuccess: (title: string, message: string, onClose?: () => void) => void;
  showError: (title: string, message: string, onClose?: () => void) => void;
  showWarning: (title: string, message: string, onClose?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalConfig, setModalConfig] = useState<CustomModalProps>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = (params: ShowModalParams) => {
    setModalConfig({
      visible: true,
      ...params,
      onClose: () => {
        setModalConfig((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  const showSuccess = (title: string, message: string, onClose?: () => void) => {
    showModal({
      type: 'success',
      title,
      message,
      primaryButton: {
        text: 'OK',
        onPress: () => {
          onClose?.();
        },
        variant: 'success',
      },
    });
  };

  const showError = (title: string, message: string, onClose?: () => void) => {
    showModal({
      type: 'error',
      title,
      message,
      primaryButton: {
        text: 'OK',
        onPress: () => {
          onClose?.();
        },
        variant: 'danger',
      },
    });
  };

  const showWarning = (title: string, message: string, onClose?: () => void) => {
    showModal({
      type: 'warning',
      title,
      message,
      primaryButton: {
        text: 'OK',
        onPress: () => {
          onClose?.();
        },
      },
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    showModal({
      type: 'confirm',
      title,
      message,
      primaryButton: {
        text: 'Confirm',
        onPress: async () => {
          await onConfirm();
        },
      },
      secondaryButton: {
        text: 'Cancel',
        onPress: () => {
          onCancel?.();
        },
      },
    });
  };

  return (
    <ModalContext.Provider
      value={{
        showModal,
        hideModal,
        showSuccess,
        showError,
        showWarning,
        showConfirm,
      }}
    >
      {children}
      <CustomModal {...modalConfig} />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};
