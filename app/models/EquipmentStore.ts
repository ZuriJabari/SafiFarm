import { Instance, SnapshotOut, types, getRoot } from "mobx-state-tree"
import { RootStore } from "./RootStore"

export const EquipmentModel = types.model("Equipment").props({
  id: types.identifier,
  name: types.string,
  description: types.string,
  type: types.string,
  dailyRate: types.number,
  images: types.array(types.string),
  ownerId: types.string,
  location: types.string,
  status: types.optional(types.enumeration(["available", "rented", "maintenance"]), "available"),
  createdAt: types.string
})

export const RentalModel = types.model("Rental").props({
  id: types.identifier,
  equipmentId: types.string,
  equipmentName: types.string,
  renterId: types.string,
  ownerId: types.string,
  startDate: types.string,
  endDate: types.string,
  totalCost: types.number,
  status: types.enumeration(["pending", "active", "completed", "cancelled"]),
  createdAt: types.string
})

export const EquipmentStoreModel = types
  .model("EquipmentStore")
  .props({
    equipment: types.optional(types.array(EquipmentModel), []),
    rentals: types.optional(types.array(RentalModel), []),
    isLoading: types.optional(types.boolean, false)
  })
  .views((self) => ({
    get currentUserId() {
      const root: RootStore = getRoot(self)
      return root.userStore?.user?.id
    },
    getEquipmentById(id: string) {
      return self.equipment.find((item) => item.id === id)
    },
    get userRentals() {
      return self.currentUserId
        ? self.rentals.filter((rental) => rental.renterId === self.currentUserId)
        : []
    },
    get userEquipment() {
      return self.currentUserId
        ? self.equipment.filter((item) => item.ownerId === self.currentUserId)
        : []
    }
  }))
  .actions((self) => ({
    setRootStore(rootStore: RootStore) {
      (self as any).rootStore = rootStore
    },
    addEquipment(equipment: typeof EquipmentModel.Type) {
      self.equipment.push(equipment)
    },
    updateEquipment(id: string, updates: Partial<typeof EquipmentModel.Type>) {
      const equipment = self.getEquipmentById(id)
      if (equipment) {
        Object.assign(equipment, updates)
      }
    },
    removeEquipment(id: string) {
      const index = self.equipment.findIndex((item) => item.id === id)
      if (index !== -1) {
        self.equipment.splice(index, 1)
      }
    },
    addRental(rental: typeof RentalModel.Type) {
      self.rentals.push(rental)
      const equipment = self.getEquipmentById(rental.equipmentId)
      if (equipment) {
        equipment.status = "rented"
      }
    },
    updateRentalStatus(rentalId: string, status: string) {
      const rental = self.rentals.find(r => r.id === rentalId)
      if (rental) {
        rental.status = status as any
        if (status === "completed" || status === "cancelled") {
          const equipment = self.getEquipmentById(rental.equipmentId)
          if (equipment) {
            equipment.status = "available"
          }
        }
      }
    },
    reset() {
      self.equipment.clear()
      self.rentals.clear()
      self.isLoading = false
    }
  }))

export interface EquipmentStore extends Instance<typeof EquipmentStoreModel> {}
export interface EquipmentStoreSnapshot extends SnapshotOut<typeof EquipmentStoreModel> {}