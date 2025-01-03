export interface MarketplaceListing {
  id: string
  name: string
  price: number
  quantity: number
  images: string[]
  description?: string
  sellerId?: string
  category?: string
  createdAt?: string
  updatedAt?: string
}

export interface Purchase {
  id: string
  productName: string
  totalCost: number
  quantity: number
  status: "pending" | "completed" | "cancelled"
  createdAt: string
  sellerId?: string
  buyerId?: string
  listingId?: string
  paymentMethod?: string
  deliveryAddress?: string
} 