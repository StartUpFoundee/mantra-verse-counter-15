
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export class NativeFeatures {
  private static volumeButtonListener: ((event: KeyboardEvent) => void) | null = null;
  private static mediaSessionCallback: (() => void) | null = null;

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

  // Enhanced Volume Button Detection for Web and Native
  static addVolumeButtonListener(callback: () => void): void {
    // Remove existing listeners if any
    this.removeVolumeButtonListener();
    
    this.mediaSessionCallback = callback;

    if (this.isNative()) {
      // Native platform implementation
      console.log('Setting up native volume button detection');
      
      this.volumeButtonListener = (event: KeyboardEvent) => {
        if (event.code === 'AudioVolumeUp' || event.code === 'AudioVolumeDown' || 
            event.key === 'AudioVolumeUp' || event.key === 'AudioVolumeDown') {
          event.preventDefault();
          callback();
        }
      };
      
      document.addEventListener('keydown', this.volumeButtonListener, { capture: true });
    } else {
      // Enhanced web implementation
      console.log('Setting up enhanced web volume button detection');
      
      // Method 1: Media Session API (Primary for web)
      if ('mediaSession' in navigator && navigator.mediaSession) {
        // Set minimal metadata to enable media session
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Mantra Counter',
          artist: 'Spiritual Practice',
          album: 'Meditation',
        });

        // Handle volume-related actions
        const handleMediaAction = () => {
          console.log('Media session volume action detected');
          callback();
        };

        // Set up action handlers for volume buttons
        try {
          navigator.mediaSession.setActionHandler('seekforward', handleMediaAction);
          navigator.mediaSession.setActionHandler('seekbackward', handleMediaAction);
          navigator.mediaSession.setActionHandler('nexttrack', handleMediaAction);
          navigator.mediaSession.setActionHandler('previoustrack', handleMediaAction);
          
          // Also try direct volume handlers if supported
          if ('setActionHandler' in navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('volumeup' as any, handleMediaAction);
            navigator.mediaSession.setActionHandler('volumedown' as any, handleMediaAction);
          }
          
          console.log('Media Session API volume handlers registered');
        } catch (error) {
          console.warn('Some Media Session handlers failed:', error);
        }
      }

      // Method 2: Enhanced keyboard event listeners
      this.volumeButtonListener = (event: KeyboardEvent) => {
        // Comprehensive volume key detection
        const volumeKeyCodes = [
          'AudioVolumeUp', 'AudioVolumeDown',
          'VolumeUp', 'VolumeDown',
          'MediaVolumeUp', 'MediaVolumeDown'
        ];
        
        const volumeKeyNumbers = [
          174, 175, // Standard volume up/down
          181, 182, // Alternative volume codes
          183, // Launch media
        ];

        const isVolumeKey = volumeKeyCodes.includes(event.code) || 
                           volumeKeyCodes.includes(event.key) ||
                           volumeKeyNumbers.includes(event.keyCode) ||
                           volumeKeyNumbers.includes(event.which);

        if (isVolumeKey) {
          event.preventDefault();
          event.stopPropagation();
          console.log('Volume key detected:', { code: event.code, key: event.key, keyCode: event.keyCode });
          callback();
        }
      };
      
      // Add listeners with different capture modes
      document.addEventListener('keydown', this.volumeButtonListener, { capture: true, passive: false });
      window.addEventListener('keydown', this.volumeButtonListener, { capture: true, passive: false });
      
      // Method 3: Focus management for better key capture
      if (document.activeElement !== document.body) {
        document.body.focus();
      }
      
      // Method 4: Visibility API to re-enable when page becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden && this.mediaSessionCallback) {
          console.log('Page visible - refreshing volume button detection');
          // Refresh media session
          setTimeout(() => {
            if ('mediaSession' in navigator && navigator.mediaSession) {
              navigator.mediaSession.playbackState = 'playing';
            }
          }, 100);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      console.log('Web volume button listeners added with enhanced detection');
    }
  }

  static removeVolumeButtonListener(): void {
    if (this.volumeButtonListener) {
      document.removeEventListener('keydown', this.volumeButtonListener, { capture: true });
      window.removeEventListener('keydown', this.volumeButtonListener, { capture: true });
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
        navigator.mediaSession.setActionHandler('volumeup' as any, null);
        navigator.mediaSession.setActionHandler('volumedown' as any, null);
        navigator.mediaSession.metadata = null;
        console.log('Media session handlers cleared');
      } catch (error) {
        console.warn('Error clearing media session:', error);
      }
    }
    
    this.mediaSessionCallback = null;
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
