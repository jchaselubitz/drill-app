import type { ExpoConfig } from '@expo/config-types';

// Load environment variables
try {
  require('dotenv/config');
} catch (error) {
  // dotenv/config not available, continue without it
  console.warn('dotenv/config not available, environment variables may not be loaded');
}

type AppConfig = ExpoConfig & {
  extra: {
    supabaseUrl?: string;
    supabasePublishableKey?: string;
    openAiProxyUrl?: string;
  };
};

const config: AppConfig = {
  name: 'Drill App',
  slug: 'drill-app',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'drillapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.drillapp.mobile',
  },
  android: {
    package: 'com.drillapp.mobile',
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    openAiProxyUrl: process.env.EXPO_PUBLIC_OPENAI_PROXY_URL,
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
};

export default config;
