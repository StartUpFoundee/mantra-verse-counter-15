import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export class NativeFeatures {
  private static volumeButtonListener: ((event: KeyboardEvent) => void) | null = null;
  private static mediaSessionCallback: (() => void) | null = null;
  private static nativeVolumeCallback: (() => void) | null = null;

  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Enhanced Haptic Feedback
  static async triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (!this.isNative()) {
      // Fallback to web vibration
      if ('vibrate' in navigator) {
        const patterns = {
          light: [50],
          medium: [100],
          heavy: [200]
        };
        navigator.vibrate(patterns[type]);
      }
      return;
    }

    try {
      const impactStyles = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      };
      await Haptics.impact({ style: impactStyles[type] });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }

  // Mantra Count Haptic Pattern
  static async triggerMantraHaptic(): Promise<void> {
    if (!this.isNative()) {
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300]);
      }
      return;
    }

    try {
      // Double tap pattern for mantra count
      await Haptics.impact({ style: ImpactStyle.Medium });
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
      }, 150);
    } catch (error) {
      console.error('Mantra haptic failed:', error);
    }
  }

  // Enhanced Volume Button Detection with guaranteed callback execution
  static addVolumeButtonListener(callback: () => void): void {
    // Remove existing listeners if any
    this.removeVolumeButtonListener();
    
    this.nativeVolumeCallback = callback;
    console.log('Setting up volume button detection - callback registered:', !!callback);

    if (this.isNative()) {
      // Native platform implementation with direct event handling
      console.log('Setting up NATIVE volume button detection');
      
      // For native platforms, we'll use multiple detection methods
      this.volumeButtonListener = (event: KeyboardEvent) => {
        console.log('Native keyboard event detected:', { 
          code: event.code, 
          key: event.key, 
          keyCode: event.keyCode 
        });
        
        const isVolumeKey = event.code === 'AudioVolumeUp' || 
                           event.code === 'AudioVolumeDown' || 
                           event.key === 'AudioVolumeUp' || 
                           event.key === 'AudioVolumeDown' ||
                           event.keyCode === 174 || // Volume down
                           event.keyCode === 175;   // Volume up
        
        if (isVolumeKey) {
          event.preventDefault();
          event.stopPropagation();
          console.log('NATIVE volume button detected - executing callback');
          callback();
        }
      };
      
      // Add listeners with capture to catch events early
      document.addEventListener('keydown', this.volumeButtonListener, { 
        capture: true, 
        passive: false 
      });
      
      // For Capacitor, also try to listen for hardware key events
      if ((window as any).Capacitor) {
        console.log('Adding Capacitor-specific volume listeners');
        // Try to add Capacitor plugin listeners if available
        this.addCapacitorVolumeListeners(callback);
      }
      
    } else {
      // Enhanced web implementation
      console.log('Setting up ENHANCED WEB volume button detection');
      
      // Method 1: Media Session API (Primary for web)
      if ('mediaSession' in navigator && navigator.mediaSession) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Mantra Counter',
          artist: 'Spiritual Practice',
          album: 'Meditation',
        });

        const handleMediaAction = () => {
          console.log('WEB media session volume action detected - executing callback');
          callback();
        };

        try {
          navigator.mediaSession.setActionHandler('seekforward', handleMediaAction);
          navigator.mediaSession.setActionHandler('seekbackward', handleMediaAction);
          navigator.mediaSession.setActionHandler('nexttrack', handleMediaAction);
          navigator.mediaSession.setActionHandler('previoustrack', handleMediaAction);
          
          console.log('Web Media Session API volume handlers registered');
        } catch (error) {
          console.warn('Some Media Session handlers failed:', error);
        }
      }

      // Method 2: Enhanced keyboard event listeners for web
      this.volumeButtonListener = (event: KeyboardEvent) => {
        console.log('Web keyboard event detected:', { 
          code: event.code, 
          key: event.key, 
          keyCode: event.keyCode 
        });
        
        const volumeKeyCodes = [
          'AudioVolumeUp', 'AudioVolumeDown',
          'VolumeUp', 'VolumeDown',
          'MediaVolumeUp', 'MediaVolumeDown'
        ];
        
        const volumeKeyNumbers = [174, 175, 181, 182, 183];

        const isVolumeKey = volumeKeyCodes.includes(event.code) || 
                           volumeKeyCodes.includes(event.key) ||
                           volumeKeyNumbers.includes(event.keyCode);

        if (isVolumeKey) {
          event.preventDefault();
          event.stopPropagation();
          console.log('WEB volume key detected - executing callback');
          callback();
        }
      };
      
      document.addEventListener('keydown', this.volumeButtonListener, { 
        capture: true, 
        passive: false 
      });
    }
  }

  // Add Capacitor-specific volume button detection
  private static addCapacitorVolumeListeners(callback: () => void): void {
    try {
      // Check if we have access to Capacitor plugins
      const { Capacitor } = window as any;
      
      if (Capacitor && Capacitor.Plugins) {
        console.log('Attempting to add Capacitor volume button listeners');
        
        // Try to use keyboard plugin or hardware buttons if available
        if (Capacitor.Plugins.Keyboard) {
          Capacitor.Plugins.Keyboard.addListener('keyboardDidShow', () => {
            console.log('Capacitor keyboard event detected');
          });
        }
        
        // For Android, try to intercept volume key events
        if (Capacitor.platform === 'android') {
          console.log('Setting up Android-specific volume detection');
          
          // Add Android hardware back button as potential volume button
          document.addEventListener('backbutton', (e) => {
            console.log('Android hardware button detected');
            e.preventDefault();
            callback();
          }, false);
        }
        
        // For iOS, volume buttons are more restricted
        if (Capacitor.platform === 'ios') {
          console.log('Setting up iOS-specific volume detection');
          // iOS volume detection is limited, rely on media session
        }
      }
    } catch (error) {
      console.warn('Capacitor volume listeners setup failed:', error);
    }
  }

  static removeVolumeButtonListener(): void {
    if (this.volumeButtonListener) {
      document.removeEventListener('keydown', this.volumeButtonListener, { capture: true });
      this.volumeButtonListener = null;
      console.log('Volume button keyboard listeners removed');
    }
    
    // Clear media session handlers
    if ('mediaSession' in navigator && navigator.mediaSession) {
      try {
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.metadata = null;
        console.log('Media session handlers cleared');
      } catch (error) {
        console.warn('Error clearing media session:', error);
      }
    }
    
    this.nativeVolumeCallback = null;
    console.log('All volume button listeners removed');
  }

  // Initialize PWA-ready media session
  static initializeMediaSession(): void {
    if ('mediaSession' in navigator && navigator.mediaSession) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Mantra Counter',
        artist: 'Meditation App',
        album: 'Spiritual Practice',
      });
      
      // Set playback state to enable media controls
      navigator.mediaSession.playbackState = 'playing';
      console.log('Media session initialized for PWA');
    }
  }

  // Status Bar Control
  static async setStatusBarStyle(isDark: boolean = false): Promise<void> {
    if (!this.isNative()) return;

    try {
      await StatusBar.setStyle({ 
        style: isDark ? Style.Dark : Style.Light 
      });
      await StatusBar.setBackgroundColor({ color: '#f59e0b' });
    } catch (error) {
      console.error('Status bar update failed:', error);
    }
  }

  // Hide Status Bar (for public mode)
  static async hideStatusBar(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await StatusBar.hide();
    } catch (error) {
      console.error('Hide status bar failed:', error);
    }
  }

  // Show Status Bar
  static async showStatusBar(): Promise<void> {
    if (!this.isNative()) return;

    try {
      await StatusBar.show();
    } catch (error) {
      console.error('Show status bar failed:', error);
    }
  }

  // Get Device Info
  static async getDeviceInfo(): Promise<any> {
    if (!this.isNative()) {
      return {
        platform: 'web',
        model: 'Browser',
        operatingSystem: navigator.platform
      };
    }

    try {
      return await Device.getInfo();
    } catch (error) {
      console.error('Get device info failed:', error);
      return null;
    }
  }

  // Handle App State Changes
  static addAppStateListener(callback: (isActive: boolean) => void): void {
    if (!this.isNative()) return;

    App.addListener('appStateChange', ({ isActive }) => {
      callback(isActive);
    });
  }

  // Prevent App from going to background (for public mode)
  static async keepAwake(): Promise<void> {
    console.log('Native keep awake requested');
  }
}
