import { Ionicons } from '@expo/vector-icons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { useColors } from '@/hooks';

export type ButtonState = 'default' | 'disabled' | 'loading' | 'success' | 'error';

type ButtonProps = {
  text: string | React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  buttonState?: ButtonState;
  loadingText?: string | React.ReactNode;
  successText?: string | React.ReactNode;
  errorText?: string | React.ReactNode;
  icon?: {
    name: keyof typeof Ionicons.glyphMap;
    size?: number;
    position?: 'left' | 'right';
  };
  successIcon?: {
    name: keyof typeof Ionicons.glyphMap;
    size?: number;
  };
  reset?: boolean;
  setButtonState?: (state: ButtonState) => void;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  text,
  onPress,
  variant = 'primary',
  buttonState: buttonStateProp = 'default',
  loadingText,
  successText,
  errorText,
  icon,
  successIcon,
  reset = false,
  setButtonState,
  style,
}: ButtonProps) {
  const colors = useColors();
  const useGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

  const [internalState, setInternalState] = useState<ButtonState>(buttonStateProp);

  // Update internal state when prop changes
  useEffect(() => {
    if (!setButtonState) {
      setInternalState(buttonStateProp);
    }
  }, [buttonStateProp, setButtonState]);

  const currentState = setButtonState ? buttonStateProp : internalState;
  const updateState = setButtonState || setInternalState;

  useEffect(() => {
    if (reset && currentState === 'success') {
      const timeout = setTimeout(() => {
        updateState('default');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [currentState, reset, updateState]);

  const isDisabled = currentState === 'loading' || currentState === 'disabled';

  const backgroundColor =
    variant === 'primary' ? colors.primary : variant === 'destructive' ? colors.error : colors.card;
  const textColor =
    variant === 'primary'
      ? colors.primaryText
      : variant === 'destructive'
        ? colors.primaryText
        : colors.text;

  const Container = useGlass ? GlassView : View;

  const getTintColor = () => {
    if (isDisabled) {
      return 'rgba(128, 128, 128, 0.5)';
    }
    if (variant === 'primary') {
      return colors.primary;
    }
    if (variant === 'destructive') {
      return colors.error;
    }
    return undefined;
  };

  const tintColor = useGlass ? getTintColor() : undefined;

  const renderContent = () => {
    if (currentState === 'loading') {
      return (
        <View style={styles.contentContainer}>
          <ActivityIndicator color={textColor} size="small" />
          {loadingText && (
            <Text style={[styles.text, { color: textColor, marginLeft: 8 }]}>{loadingText}</Text>
          )}
        </View>
      );
    }

    if (currentState === 'success') {
      const iconName = successIcon?.name || 'checkmark';
      const iconSize = successIcon?.size || 20;
      return (
        <View style={styles.contentContainer}>
          {successText && <Text style={[styles.text, { color: textColor }]}>{successText}</Text>}
          <Ionicons name={iconName} size={iconSize} color={textColor} style={{ marginLeft: 8 }} />
        </View>
      );
    }

    if (currentState === 'error') {
      return (
        <View style={styles.contentContainer}>
          {errorText && <Text style={[styles.text, { color: textColor }]}>{errorText}</Text>}
        </View>
      );
    }

    // Default state
    const iconName = icon?.name;
    const iconSize = icon?.size || 24;
    const iconPosition = icon?.position || 'left';

    return (
      <View style={styles.contentContainer}>
        {iconName && iconPosition === 'left' && (
          <Ionicons name={iconName} size={iconSize} color={textColor} style={{ marginRight: 8 }} />
        )}
        <Text style={[styles.text, { color: textColor }]}>{text}</Text>
        {iconName && iconPosition === 'right' && (
          <Ionicons name={iconName} size={iconSize} color={textColor} style={{ marginLeft: 8 }} />
        )}
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.buttonWrapper,
        pressed && !isDisabled && styles.pressed,
        isDisabled && !useGlass && styles.disabled,
      ]}
    >
      <Container
        style={[styles.button, style, !useGlass && { backgroundColor }]}
        glassEffectStyle="regular"
        {...(useGlass && tintColor ? { tintColor } : {})}
        {...(useGlass && { isInteractive: true })}
      >
        {renderContent()}
      </Container>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  }, // Only used when not using glass effect
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
