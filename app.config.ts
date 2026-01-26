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
  version: process.env.EXPO_PUBLIC_VERSION,
  orientation: 'portrait',
  scheme: 'drillapp',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/1024.png',
  ios: {
    icon: './assets/images/1024.png',
    supportsTablet: true,
    bundleIdentifier: 'com.drillapp.mobile',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIDesignRequiresCompatibility: false,
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
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/1024.png',
      backgroundImage: './assets/images/1024.png',
      monochromeImage: './assets/images/1024.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-background-task',
    'expo-asset',
    [
      'expo-splash-screen',
      {
        image: './assets/images/1024.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    version: process.env.EXPO_PUBLIC_VERSION,
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
