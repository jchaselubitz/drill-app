const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const legacyWindowStartup = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

`;

// The SDK 55 AppDelegate still owns the React Native factory and Expo subscribers.
const sceneDelegate = `
@objc(DrillSceneDelegate)
class DrillSceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    let sceneWindow = UIWindow(windowScene: windowScene)
    window = sceneWindow
    appDelegate.window = sceneWindow

    var launchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
    if let context = connectionOptions.urlContexts.first {
      launchOptions[.url] = context.url
      launchOptions[.sourceApplication] = context.options.sourceApplication
      launchOptions[.annotation] = context.options.annotation
    }
    if let activity = connectionOptions.userActivities.first {
      launchOptions[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType.rawValue: activity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": activity
      ]
    }

    factory.startReactNative(withModuleName: "main", in: sceneWindow, launchOptions: launchOptions)
  }

  func scene(_ scene: UIScene, openURLContexts contexts: Set<UIOpenURLContext>) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    for context in contexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [.openInPlace: context.options.openInPlace]
      options[.sourceApplication] = context.options.sourceApplication
      options[.annotation] = context.options.annotation
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: options)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(UIApplication.shared, continue: userActivity) { _ in }
  }
}
`;

module.exports = function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'DrillSceneDelegate',
          },
        ],
      },
    };
    return config;
  });

  return withAppDelegate(config, (config) => {
    const appDelegate = config.modResults;
    if (appDelegate.contents.includes('class DrillSceneDelegate:')) {
      return config;
    }

    if (appDelegate.language !== 'swift' || !appDelegate.contents.includes(legacyWindowStartup)) {
      throw new Error('The Expo AppDelegate template changed. Update Drill’s iOS scene plugin.');
    }

    appDelegate.contents =
      appDelegate.contents.replace(legacyWindowStartup, '').trimEnd() + '\n' + sceneDelegate;
    return config;
  });
};
