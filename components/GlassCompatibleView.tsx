import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ComponentProps, Ref } from 'react';
import { forwardRef } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

/** Use when you need the glass-available flag (e.g. for GlassContainer or disableGlass on children). */
export function getGlassAvailable(disableGlass = false): boolean {
  return !disableGlass && Platform.OS === 'ios' && isLiquidGlassAvailable();
}

type GlassViewProps = ComponentProps<typeof GlassView>;

type GlassCompatibleViewProps = Omit<ViewProps, 'style'> & {
  disableGlass?: boolean;
  style?: ViewProps['style'];
  /** Applied only when falling back to View (glass disabled or unavailable). */
  fallbackStyle?: ViewProps['style'];
  glassEffectStyle?: GlassViewProps['glassEffectStyle'];
  isInteractive?: GlassViewProps['isInteractive'];
  colorScheme?: GlassViewProps['colorScheme'];
  tintColor?: GlassViewProps['tintColor'];
};

/**
 * Renders GlassView on iOS when liquid glass is available, otherwise View.
 * Use `disableGlass` to force View even when glass is available.
 */
export const GlassCompatibleView = forwardRef<View, GlassCompatibleViewProps>(
  function GlassCompatibleView(
    {
      disableGlass = false,
      style,
      fallbackStyle,
      glassEffectStyle = 'regular',
      isInteractive,
      colorScheme,
      tintColor,
      ...rest
    },
    ref: Ref<View>
  ) {
    const useGlass = !disableGlass && Platform.OS === 'ios' && isLiquidGlassAvailable();

    if (useGlass) {
      return (
        <GlassView
          ref={ref}
          {...rest}
          style={style}
          glassEffectStyle={glassEffectStyle}
          isInteractive={isInteractive}
          colorScheme={colorScheme}
          tintColor={tintColor}
        />
      );
    }

    return <View ref={ref} {...rest} style={[style, fallbackStyle]} />;
  }
);
