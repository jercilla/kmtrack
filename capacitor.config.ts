import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.kmtrack',
  appName: 'KMTrack',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;