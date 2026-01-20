import type { ExpoConfig } from '@expo/config-types';

type AppConfig = ExpoConfig & {
  extra: {
    geminiApiKey?: string;
    googleCloudTtsApiKey?: string;
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
  icon: './assets/images/1024.png',
  ios: {
    icon: './assets/images/1024.png',
    supportsTablet: true,
    bundleIdentifier: 'com.drillapp.mobile',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ['processing'],
      BGTaskSchedulerPermittedIdentifiers: [
        'com.drillapp.mobile.background-review-fetch',
        'com.drillapp.mobile.background-audio-fetch',
      ],
    },
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
  plugins: [
    'expo-router',
    [
      'expo-audio',
      {
        microphonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    googleCloudTtsApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    openAiProxyUrl: process.env.EXPO_PUBLIC_OPENAI_PROXY_URL,
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
};

export default config;
