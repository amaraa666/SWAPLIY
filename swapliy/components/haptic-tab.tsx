import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { StyleProp, ViewStyle } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const resolvedStyle =
    typeof props.style === 'function'
      ? props.style
      : () => props.style as StyleProp<ViewStyle>;

  return (
    <PlatformPressable
      {...props}
      style={(state) => [
        resolvedStyle(state),
        {
          borderRadius: 16,
          overflow: 'hidden',
          marginHorizontal: 2,
          marginVertical: 0,
        },
      ]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
