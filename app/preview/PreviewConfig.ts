import { Platform } from "react-native"

export interface PreviewDevice {
  id: string
  name: string
  width: number
  height: number
  scale: number
  platform: "ios" | "android" | "web"
}

export const previewDevices: PreviewDevice[] = [
  {
    id: "iphone-14-pro",
    name: "iPhone 14 Pro",
    width: 393,
    height: 852,
    scale: 3,
    platform: "ios"
  },
  {
    id: "iphone-se",
    name: "iPhone SE",
    width: 375,
    height: 667,
    scale: 2,
    platform: "ios"
  },
  {
    id: "pixel-7",
    name: "Pixel 7",
    width: 412,
    height: 915,
    scale: 2.625,
    platform: "android"
  },
  {
    id: "samsung-s21",
    name: "Samsung S21",
    width: 360,
    height: 800,
    scale: 3,
    platform: "android"
  },
  {
    id: "web-desktop",
    name: "Web Desktop",
    width: 1280,
    height: 800,
    scale: 1,
    platform: "web"
  },
  {
    id: "web-tablet",
    name: "Web Tablet",
    width: 768,
    height: 1024,
    scale: 2,
    platform: "web"
  }
]

export interface PreviewConfig {
  showDeviceFrame: boolean
  showDeviceControls: boolean
  showInspector: boolean
  showPerformanceStats: boolean
  showAccessibilityOverlay: boolean
  simulateOffline: boolean
  simulateSlow3G: boolean
  simulateLowMemory: boolean
  simulateLowBattery: boolean
}

export const defaultPreviewConfig: PreviewConfig = {
  showDeviceFrame: true,
  showDeviceControls: true,
  showInspector: false,
  showPerformanceStats: true,
  showAccessibilityOverlay: false,
  simulateOffline: false,
  simulateSlow3G: false,
  simulateLowMemory: false,
  simulateLowBattery: false
}

export const getDeviceSpecificConfig = (platform: string) => {
  switch (platform) {
    case "ios":
      return {
        statusBarHeight: 47,
        navigationBarHeight: 44,
        tabBarHeight: 49,
        safeAreaInsets: { top: 47, bottom: 34, left: 0, right: 0 }
      }
    case "android":
      return {
        statusBarHeight: 24,
        navigationBarHeight: 56,
        tabBarHeight: 48,
        safeAreaInsets: { top: 24, bottom: 0, left: 0, right: 0 }
      }
    case "web":
      return {
        statusBarHeight: 0,
        navigationBarHeight: 64,
        tabBarHeight: 56,
        safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
      }
    default:
      return {
        statusBarHeight: 0,
        navigationBarHeight: 0,
        tabBarHeight: 0,
        safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 }
      }
  }
}

export const simulateNetworkCondition = (condition: "offline" | "slow3G" | "4G") => {
  switch (condition) {
    case "offline":
      return {
        downlink: 0,
        rtt: Infinity,
        effectiveType: "slow-2g",
        saveData: true
      }
    case "slow3G":
      return {
        downlink: 0.4,
        rtt: 600,
        effectiveType: "3g",
        saveData: true
      }
    case "4G":
      return {
        downlink: 10,
        rtt: 100,
        effectiveType: "4g",
        saveData: false
      }
  }
}

export const simulateDeviceCondition = (condition: "lowMemory" | "lowBattery" | "normal") => {
  switch (condition) {
    case "lowMemory":
      return {
        memory: {
          totalJSHeapSize: 4096 * 1024 * 1024, // 4GB
          usedJSHeapSize: 3686 * 1024 * 1024,  // 3.6GB
          jsHeapSizeLimit: 4096 * 1024 * 1024  // 4GB
        }
      }
    case "lowBattery":
      return {
        battery: {
          level: 0.15,
          charging: false,
          chargingTime: Infinity,
          dischargingTime: 1800
        }
      }
    case "normal":
      return {
        memory: {
          totalJSHeapSize: 4096 * 1024 * 1024,
          usedJSHeapSize: 1024 * 1024 * 1024,
          jsHeapSizeLimit: 4096 * 1024 * 1024
        },
        battery: {
          level: 0.8,
          charging: true,
          chargingTime: 1800,
          dischargingTime: Infinity
        }
      }
  }
}
