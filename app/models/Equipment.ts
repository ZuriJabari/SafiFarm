export interface Equipment {
  id: string
  name: string
  description: string
  dailyRate: number
  images: string[]
  category: string
  availability: boolean
  ownerId: string
  specifications?: {
    [key: string]: string | number
  }
  location?: string
  condition?: string
}

export interface EquipmentRental {
  id: string
  equipmentId: string
  equipmentName: string
  renterId: string
  ownerId: string
  startDate: string
  endDate: string
  totalCost: number
  status: "pending" | "active" | "completed" | "cancelled"
  paymentStatus?: "pending" | "paid" | "refunded"
  paymentMethod?: string
  notes?: string
} 