import { Instance, SnapshotOut, types } from "mobx-state-tree"

export const EquipmentModel = types.model("Equipment").props({
  id: types.identifier,
  name: types.string,
  description: types.string,
  type: types.string,
  dailyRate: types.number,
  weeklyRate: types.maybe(types.number),
  monthlyRate: types.maybe(types.number),
  ownerId: types.string,
  location: types.string,
  images: types.array(types.string),
  specifications: types.map(types.string),
  availability: types.enumeration(["available", "rented", "maintenance"]),
  condition: types.enumeration(["excellent", "good", "fair", "needs_maintenance"])
})

export const RentalModel = types.model("Rental").props({
  id: types.identifier,
  equipmentId: types.string,
  renterId: types.string,
  ownerId: types.string,
  startDate: types.Date,
  endDate: types.Date,
  totalCost: types.number,
  status: types.enumeration(["pending", "active", "completed", "cancelled"]),
  paymentStatus: types.enumeration(["pending", "processing", "completed", "failed"]),
  createdAt: types.Date,
  updatedAt: types.Date
})

export const MaintenanceRecordModel = types.model("MaintenanceRecord").props({
  id: types.identifier,
  equipmentId: types.string,
  date: types.Date,
  description: types.string,
  cost: types.number,
  performedBy: types.string,
  nextMaintenanceDate: types.maybe(types.Date)
})

export const EquipmentStoreModel = types
  .model("EquipmentStore")
  .props({
    equipment: types.array(EquipmentModel),
    rentals: types.array(RentalModel),
    maintenanceRecords: types.array(MaintenanceRecordModel),
    isLoading: types.optional(types.boolean, false)
  })
  .views((self) => ({
    getEquipmentById(id: string) {
      return self.equipment.find((eq) => eq.id === id)
    },
    getRentalById(id: string) {
      return self.rentals.find((rental) => rental.id === id)
    },
    getRentalsByRenter(renterId: string) {
      return self.rentals.filter((rental) => rental.renterId === renterId)
    },
    getRentalsByOwner(ownerId: string) {
      return self.rentals.filter((rental) => rental.ownerId === ownerId)
    },
    getMaintenanceRecords(equipmentId: string) {
      return self.maintenanceRecords.filter((record) => record.equipmentId === equipmentId)
    }
  }))
  .actions((self) => ({
    addEquipment(equipment: typeof EquipmentModel.Type) {
      self.equipment.push(equipment)
    },
    updateEquipment(id: string, updates: Partial<typeof EquipmentModel.Type>) {
      const equipment = self.getEquipmentById(id)
      if (equipment) {
        Object.assign(equipment, updates)
      }
    },
    createRental(rental: typeof RentalModel.Type) {
      self.rentals.push(rental)
      const equipment = self.getEquipmentById(rental.equipmentId)
      if (equipment) {
        equipment.availability = "rented"
      }
    },
    updateRentalStatus(rentalId: string, status: string, paymentStatus: string) {
      const rental = self.getRentalById(rentalId)
      if (rental) {
        rental.status = status as any
        rental.paymentStatus = paymentStatus as any
        rental.updatedAt = new Date()

        if (status === "completed") {
          const equipment = self.getEquipmentById(rental.equipmentId)
          if (equipment) {
            equipment.availability = "available"
          }
        }
      }
    },
    addMaintenanceRecord(record: typeof MaintenanceRecordModel.Type) {
      self.maintenanceRecords.push(record)
      const equipment = self.getEquipmentById(record.equipmentId)
      if (equipment) {
        equipment.availability = "maintenance"
      }
    },
    completeMaintenanceRecord(equipmentId: string) {
      const equipment = self.getEquipmentById(equipmentId)
      if (equipment) {
        equipment.availability = "available"
      }
    },
    reset() {
      self.equipment.clear()
      self.rentals.clear()
      self.maintenanceRecords.clear()
      self.isLoading = false
    }
  }))

export interface EquipmentStore extends Instance<typeof EquipmentStoreModel> {}
export interface EquipmentStoreSnapshot extends SnapshotOut<typeof EquipmentStoreModel> {} 