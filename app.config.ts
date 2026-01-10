import type { ExpoConfig } from '@expo/config-types';

type AppConfig = ExpoConfig & {
  extra: {
    geminiApiKey?: string;
  };
};

const config: AppConfig = {
  name: 'Drill',
  slug: 'drill-app',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'drillapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.drillapp.mobile',
  },
  android: {
    package: 'com.drillapp.mobile',
    adaptiveIcon: {
      backgroundColor: '#ffffff',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  },
};

export default config;
