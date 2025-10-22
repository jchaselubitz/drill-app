import type { ExpoConfig } from '@expo/config-types';
import 'dotenv/config';

type AppConfig = ExpoConfig & {
  extra: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
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
  newArchEnabled: false,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.drillapp.mobile'
  },
  android: {
    package: 'com.drillapp.mobile'
  },
  web: {
    bundler: 'metro',
    output: 'static'
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    openAiProxyUrl: process.env.EXPO_PUBLIC_OPENAI_PROXY_URL
  } 
};

export default config;
