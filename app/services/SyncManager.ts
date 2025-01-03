import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import { makeAutoObservable, runInAction } from "mobx"
import { v4 as uuidv4 } from "uuid"

export type SyncOperation = {
  id: string
  type: "CREATE" | "UPDATE" | "DELETE"
  entity: string
  data: any
  timestamp: number
  retryCount: number
  priority: "critical" | "high" | "normal"
}

export class SyncManager {
  private queue: SyncOperation[] = []
  private isRunning = false
  private maxRetries = 3
  private syncInterval = 1000 * 60 * 15 // 15 minutes
  private syncTimer: NodeJS.Timeout | null = null

  constructor() {
    makeAutoObservable(this)
    this.initialize()
  }

  private async initialize() {
    try {
      // Load pending operations from storage
      const storedQueue = await AsyncStorage.getItem("sync_queue")
      if (storedQueue) {
        runInAction(() => {
          this.queue = JSON.parse(storedQueue)
        })
      }

      // Start sync timer
      this.startSyncTimer()

      // Listen for network changes
      NetInfo.addEventListener(state => {
        if (state.isConnected) {
          this.sync()
        }
      })
    } catch (error) {
      console.error("Failed to initialize sync manager:", error)
    }
  }

  private startSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
    this.syncTimer = setInterval(() => this.sync(), this.syncInterval)
  }

  async addOperation(
    type: SyncOperation["type"],
    entity: string,
    data: any,
    priority: SyncOperation["priority"] = "normal"
  ) {
    const operation: SyncOperation = {
      id: uuidv4(),
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      priority
    }

    runInAction(() => {
      this.queue.push(operation)
    })

    // Persist queue
    await this.persistQueue()

    // Try to sync immediately if it's a critical operation
    if (priority === "critical") {
      this.sync()
    }
  }

  private async persistQueue() {
    try {
      await AsyncStorage.setItem("sync_queue", JSON.stringify(this.queue))
    } catch (error) {
      console.error("Failed to persist sync queue:", error)
    }
  }

  async sync() {
    if (this.isRunning || this.queue.length === 0) return

    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) return

    this.isRunning = true

    try {
      // Sort queue by priority and timestamp
      const sortedQueue = [...this.queue].sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return a.timestamp - b.timestamp
      })

      for (const operation of sortedQueue) {
        try {
          await this.processOperation(operation)
          
          // Remove successful operation
          runInAction(() => {
            this.queue = this.queue.filter(op => op.id !== operation.id)
          })
        } catch (error) {
          // Increment retry count
          operation.retryCount++
          
          // Remove operation if max retries exceeded
          if (operation.retryCount >= this.maxRetries) {
            runInAction(() => {
              this.queue = this.queue.filter(op => op.id !== operation.id)
            })
            // TODO: Notify user about failed operation
          }
        }
      }

      // Persist updated queue
      await this.persistQueue()
    } finally {
      this.isRunning = false
    }
  }

  private async processOperation(operation: SyncOperation) {
    const { type, entity, data } = operation

    switch (entity) {
      case "crops":
        return this.processCropOperation(type, data)
      case "equipment":
        return this.processEquipmentOperation(type, data)
      case "specialists":
        return this.processSpecialistOperation(type, data)
      case "payments":
        return this.processPaymentOperation(type, data)
      default:
        throw new Error(`Unknown entity type: ${entity}`)
    }
  }

  private async processCropOperation(type: SyncOperation["type"], data: any) {
    // Implement crop-specific sync logic
    switch (type) {
      case "CREATE":
        // API call to create crop
        break
      case "UPDATE":
        // API call to update crop
        break
      case "DELETE":
        // API call to delete crop
        break
    }
  }

  private async processEquipmentOperation(type: SyncOperation["type"], data: any) {
    // Implement equipment-specific sync logic
  }

  private async processSpecialistOperation(type: SyncOperation["type"], data: any) {
    // Implement specialist-specific sync logic
  }

  private async processPaymentOperation(type: SyncOperation["type"], data: any) {
    // Implement payment-specific sync logic
  }

  // Public methods to check sync status
  get pendingOperations() {
    return this.queue.length
  }

  get isSyncing() {
    return this.isRunning
  }

  // Cleanup
  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }
  }
}
