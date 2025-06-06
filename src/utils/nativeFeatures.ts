
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export class NativeFeatures {
  private static volumeButtonListener: ((event: KeyboardEvent) => void) | null = null;

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

  // Volume Button Detection
  static addVolumeButtonListener(callback: () => void): void {
    // Remove existing listener if any
    this.removeVolumeButtonListener();

    if (this.isNative()) {
      // For native platforms, we'll use a combination of approaches
      console.log('Setting up native volume button detection');
      
      // Method 1: Listen for volume key events (Android primarily)
      this.volumeButtonListener = (event: KeyboardEvent) => {
        if (event.code === 'AudioVolumeUp' || event.code === 'AudioVolumeDown' || 
            event.key === 'AudioVolumeUp' || event.key === 'AudioVolumeDown') {
          event.preventDefault();
          callback();
        }
      };
      
      document.addEventListener('keydown', this.volumeButtonListener, { capture: true });
      
      // Method 2: Override volume control (web-based fallback)
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('seekforward', () => {
          callback();
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          callback();
        });
      }
    } else {
      // Web fallback - listen for volume-related key events
      this.volumeButtonListener = (event: KeyboardEvent) => {
        // Common volume key codes across different browsers
        if (event.code === 'AudioVolumeUp' || event.code === 'AudioVolumeDown' ||
            event.key === 'AudioVolumeUp' || event.key === 'AudioVolumeDown' ||
            event.keyCode === 175 || event.keyCode === 174) { // Volume up/down key codes
          event.preventDefault();
          callback();
          console.log('Volume button detected:', event.code || event.key);
        }
      };
      
      document.addEventListener('keydown', this.volumeButtonListener, { capture: true });
      console.log('Web volume button listener added');
    }
  }

  static removeVolumeButtonListener(): void {
    if (this.volumeButtonListener) {
      document.removeEventListener('keydown', this.volumeButtonListener, { capture: true });
      this.volumeButtonListener = null;
      
      // Clear media session handlers
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
      }
      
      console.log('Volume button listener removed');
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
    // This is handled by wake lock in PublicModeScreen
    // But we can add additional native keep awake logic here if needed
    console.log('Native keep awake requested');
  }
}
