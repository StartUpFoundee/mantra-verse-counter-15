
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.93e8c13ad95641169d060f2e3356cee5',
  appName: 'mantra-verse-counter-35',
  webDir: 'dist',
  server: {
    url: 'https://93e8c13a-d956-4116-9d06-0f2e3356cee5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f59e0b',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#f59e0b'
    }
  }
};

export default config;
