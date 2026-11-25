import type { ExpoConfig } from '@expo/config-types';

type AppConfig = ExpoConfig & {
  extra: {
    appStoreBuild: boolean;
    openRouterApiKey?: string;
    drillAiUrl?: string;
  };
};

const appStoreBuild = process.env.DRILL_APP_STORE === '1';
const privateBuild = process.env.DRILL_PRIVATE_BUILD === '1' && !appStoreBuild;
function readBackendOrigin(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    ) {
      return url.origin;
    }
  } catch {
    // Report configuration errors without printing the supplied value.
  }
  throw new Error('Set EXPO_PUBLIC_DRILL_AI_URL to a public HTTPS origin.');
}

const drillAiUrl = appStoreBuild
  ? undefined
  : readBackendOrigin(process.env.EXPO_PUBLIC_DRILL_AI_URL);
const appStoreApiKey = appStoreBuild
  ? process.env.DRILL_APP_STORE_OPENROUTER_API_KEY?.trim()
  : undefined;
if (appStoreBuild && !appStoreApiKey) {
  throw new Error('Set DRILL_APP_STORE_OPENROUTER_API_KEY to the capped release key.');
}

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
    buildNumber: process.env.DRILL_IOS_BUILD_NUMBER,
    entitlements: drillAiUrl
      ? {
          'com.apple.developer.devicecheck.appattest-environment':
            process.env.DRILL_APP_ATTEST_PRODUCTION === '1' ? 'production' : 'development',
        }
      : undefined,
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
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    ['expo-build-properties', { ios: { deploymentTarget: '18.0' } }],
    './plugins/withIosSceneLifecycle.cjs',
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
    appStoreBuild,
    drillAiUrl,
    openRouterApiKey:
      appStoreApiKey ??
      (privateBuild && !drillAiUrl ? process.env.EXPO_PUBLIC_OPENROUTER_API_KEY : undefined),
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
};

export default config;
