import { Platform } from "react-native"
import * as Battery from "expo-battery"
import NetInfo, { NetInfoState } from "@react-native-community/netinfo"
import { makeAutoObservable, runInAction } from "mobx"

interface PerformanceMetrics {
  batteryLevel: number
  isLowPowerMode: boolean
  networkType: string
  isConnected: boolean
  isMetered: boolean
  memoryUsage: number
  frameRate: number
  lastUpdateTime: number
}

interface ThrottleConfig {
  disableAnimations: boolean
  reduceImageQuality: boolean
  disableBackgroundSync: boolean
  enableLightMode: boolean
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics = {
    batteryLevel: 1,
    isLowPowerMode: false,
    networkType: "unknown",
    isConnected: true,
    isMetered: false,
    memoryUsage: 0,
    frameRate: 60,
    lastUpdateTime: Date.now(),
  }

  private throttleConfig: ThrottleConfig = {
    disableAnimations: false,
    reduceImageQuality: false,
    disableBackgroundSync: false,
    enableLightMode: false,
  }

  private updateInterval: NodeJS.Timeout | null = null
  private readonly UPDATE_INTERVAL = 30000 // 30 seconds

  private constructor() {
    makeAutoObservable(this)
    this.initialize()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private async initialize() {
    // Start monitoring
    this.startMonitoring()

    // Set up listeners
    this.setupBatteryMonitoring()
    this.setupNetworkMonitoring()

    // Initial update
    await this.updateMetrics()
  }

  private startMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    this.updateInterval = setInterval(() => this.updateMetrics(), this.UPDATE_INTERVAL)
  }

  private async updateMetrics() {
    try {
      const [batteryLevel, isLowPowerMode] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.isLowPowerModeEnabledAsync(),
      ])

      const netInfo = await NetInfo.fetch()
      const memoryUsage = await this.getMemoryUsage()

      runInAction(() => {
        this.metrics = {
          ...this.metrics,
          batteryLevel,
          isLowPowerMode,
          networkType: netInfo.type,
          isConnected: !!netInfo.isConnected,
          isMetered: !!netInfo.isMetered,
          memoryUsage,
          lastUpdateTime: Date.now(),
        }

        // Update throttle config based on metrics
        this.updateThrottleConfig()
      })
    } catch (error) {
      console.error("Failed to update performance metrics:", error)
    }
  }

  private setupBatteryMonitoring() {
    Battery.addBatteryLevelListener(({ batteryLevel }) => {
      runInAction(() => {
        this.metrics.batteryLevel = batteryLevel
        this.updateThrottleConfig()
      })
    })

    Battery.addLowPowerModeListener(({ lowPowerMode }) => {
      runInAction(() => {
        this.metrics.isLowPowerMode = lowPowerMode
        this.updateThrottleConfig()
      })
    })
  }

  private setupNetworkMonitoring() {
    NetInfo.addEventListener((state: NetInfoState) => {
      runInAction(() => {
        this.metrics.networkType = state.type
        this.metrics.isConnected = !!state.isConnected
        this.metrics.isMetered = !!state.isMetered
        this.updateThrottleConfig()
      })
    })
  }

  private async getMemoryUsage(): Promise<number> {
    if (Platform.OS === "web") {
      return (performance as any).memory?.usedJSHeapSize || 0
    }
    // Note: For iOS and Android, we might need to use native modules
    // to get accurate memory usage
    return 0
  }

  private updateThrottleConfig() {
    const newConfig: ThrottleConfig = {
      disableAnimations: false,
      reduceImageQuality: false,
      disableBackgroundSync: false,
      enableLightMode: false,
    }

    // Battery-based throttling
    if (this.metrics.batteryLevel < 0.2 || this.metrics.isLowPowerMode) {
      newConfig.disableAnimations = true
      newConfig.reduceImageQuality = true
      newConfig.disableBackgroundSync = true
      newConfig.enableLightMode = true
    }

    // Network-based throttling
    if (this.metrics.isMetered || this.metrics.networkType === "cellular") {
      newConfig.reduceImageQuality = true
      newConfig.disableBackgroundSync = true
    }

    // Memory-based throttling
    if (this.metrics.memoryUsage > 0.8) {
      newConfig.disableAnimations = true
      newConfig.reduceImageQuality = true
    }

    runInAction(() => {
      this.throttleConfig = newConfig
    })
  }

  // Public methods
  get currentMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  get currentThrottleConfig(): ThrottleConfig {
    return { ...this.throttleConfig }
  }

  shouldDisableAnimations(): boolean {
    return this.throttleConfig.disableAnimations
  }

  shouldReduceImageQuality(): boolean {
    return this.throttleConfig.reduceImageQuality
  }

  shouldDisableBackgroundSync(): boolean {
    return this.throttleConfig.disableBackgroundSync
  }

  shouldEnableLightMode(): boolean {
    return this.throttleConfig.enableLightMode
  }

  // Cleanup
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    // Remove listeners
    Battery.removeBatteryLevelListener()
    Battery.removeLowPowerModeListener()
  }
}
