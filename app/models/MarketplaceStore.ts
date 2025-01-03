import { Instance, SnapshotOut, types } from "mobx-state-tree"

export const ProductModel = types.model("Product").props({
  id: types.identifier,
  name: types.string,
  description: types.string,
  price: types.number,
  quantity: types.number,
  unit: types.string,
  category: types.string,
  images: types.array(types.string),
  sellerId: types.string,
  location: types.string,
  createdAt: types.Date,
  status: types.enumeration(["available", "sold", "reserved"])
})

export const OrderModel = types.model("Order").props({
  id: types.identifier,
  productId: types.string,
  buyerId: types.string,
  sellerId: types.string,
  quantity: types.number,
  totalPrice: types.number,
  status: types.enumeration(["pending", "confirmed", "completed", "cancelled"]),
  paymentStatus: types.enumeration(["pending", "processing", "completed", "failed"]),
  createdAt: types.Date,
  updatedAt: types.Date
})

export const MarketplaceStoreModel = types
  .model("MarketplaceStore")
  .props({
    products: types.array(ProductModel),
    orders: types.array(OrderModel),
    isLoading: types.optional(types.boolean, false)
  })
  .views((self) => ({
    getProductById(id: string) {
      return self.products.find((product) => product.id === id)
    },
    getOrderById(id: string) {
      return self.orders.find((order) => order.id === id)
    },
    getOrdersByBuyer(buyerId: string) {
      return self.orders.filter((order) => order.buyerId === buyerId)
    },
    getOrdersBySeller(sellerId: string) {
      return self.orders.filter((order) => order.sellerId === sellerId)
    }
  }))
  .actions((self) => ({
    addProduct(product: typeof ProductModel.Type) {
      self.products.push(product)
    },
    updateProduct(id: string, updates: Partial<typeof ProductModel.Type>) {
      const product = self.getProductById(id)
      if (product) {
        Object.assign(product, updates)
      }
    },
    removeProduct(id: string) {
      const index = self.products.findIndex((product) => product.id === id)
      if (index !== -1) {
        self.products.splice(index, 1)
      }
    },
    createOrder(order: typeof OrderModel.Type) {
      self.orders.push(order)
      const product = self.getProductById(order.productId)
      if (product) {
        product.quantity -= order.quantity
        if (product.quantity <= 0) {
          product.status = "sold"
        }
      }
    },
    updateOrderStatus(orderId: string, status: string, paymentStatus: string) {
      const order = self.getOrderById(orderId)
      if (order) {
        order.status = status as any
        order.paymentStatus = paymentStatus as any
        order.updatedAt = new Date()
      }
    },
    reset() {
      self.products.clear()
      self.orders.clear()
      self.isLoading = false
    }
  }))

export interface MarketplaceStore extends Instance<typeof MarketplaceStoreModel> {}
export interface MarketplaceStoreSnapshot extends SnapshotOut<typeof MarketplaceStoreModel> {} 