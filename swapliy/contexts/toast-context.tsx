import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'info',
    message: '',
  });
  const translateY = useRef(new Animated.Value(-80)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -80,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    });
  };

  const showToast = (type: ToastType, message: string) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    setToast({ visible: true, type, message });
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();

    hideTimer.current = setTimeout(hideToast, 2200);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View style={[styles.wrapper, { transform: [{ translateY }] }]}>
          <View
            style={[
              styles.toast,
              toast.type === 'success' && styles.successToast,
              toast.type === 'error' && styles.errorToast,
              toast.type === 'info' && styles.infoToast,
            ]}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 58,
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  successToast: {
    backgroundColor: '#10B981',
  },
  errorToast: {
    backgroundColor: '#EF4444',
  },
  infoToast: {
    backgroundColor: '#2563EB',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
