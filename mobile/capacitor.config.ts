// Provide a local type alias to avoid a hard dependency on '@capacitor/cli' typings
// (prevents "Cannot find module '@capacitor/cli'" in environments without the package)
type CapacitorConfig = {
  appId?: string;
  appName?: string;
  webDir?: string;
  bundledWebRuntime?: boolean;
  server?: Record<string, any>;
  android?: Record<string, any>;
  plugins?: Record<string, any>;
  [key: string]: any;
};

const config: CapacitorConfig = {
  appId: 'com.malikxgo.app',
  appName: 'Malik.XGO',
  webDir: '../out',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    }
  }
};

export default config;