import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface UseFadeSlideAnimationOptions {
  initialOpacity?: number;
  initialTranslateY?: number;
  duration?: number;
  tension?: number;
  friction?: number;
  delay?: number;
  useNativeDriver?: boolean;
}

interface UseFadeSlideAnimationReturn {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

/**
 * Custom hook for fade and slide animations commonly used in screen transitions
 */
export const useFadeSlideAnimation = (
  options: UseFadeSlideAnimationOptions = {}
): UseFadeSlideAnimationReturn => {
  const {
    initialOpacity = 0,
    initialTranslateY = 30,
    duration = 700,
    tension = 35,
    friction = 7,
    delay = 0,
    useNativeDriver = true,
  } = options;

  const fadeAnim = useRef(new Animated.Value(initialOpacity)).current;
  const slideAnim = useRef(new Animated.Value(initialTranslateY)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension,
        friction,
        delay,
        useNativeDriver,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [fadeAnim, slideAnim, duration, tension, friction, delay, useNativeDriver]);

  return {
    fadeAnim,
    slideAnim,
    opacity: fadeAnim,
    translateY: slideAnim,
  };
};

export default useFadeSlideAnimation;
