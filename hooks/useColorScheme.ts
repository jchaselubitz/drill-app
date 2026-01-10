import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors } from '@/constants';

export function useColorScheme() {
  const colorScheme = useRNColorScheme() ?? 'light';
  return colorScheme;
}

export function useColors() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme];
}
