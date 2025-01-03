import { Instance, SnapshotOut, types, getRoot } from "mobx-state-tree"
import { RootStore } from "./RootStore"

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
  createdAt: types.string,
  status: types.optional(types.enumeration(["available", "sold", "reserved"]), "available")
})

export const PurchaseModel = types.model("Purchase").props({
  id: types.identifier,
  productId: types.string,
  productName: types.string,
  buyerId: types.string,
  sellerId: types.string,
  quantity: types.number,
  totalCost: types.number,
  status: types.enumeration(["pending", "completed", "cancelled"]),
  createdAt: types.string
})

export const MarketplaceStoreModel = types
  .model("MarketplaceStore")
  .props({
    products: types.optional(types.array(ProductModel), []),
    purchases: types.optional(types.array(PurchaseModel), []),
    isLoading: types.optional(types.boolean, false)
  })
  .views((self) => ({
    get currentUserId() {
      const root: RootStore = getRoot(self)
      return root.userStore?.user?.id
    },
    getProductById(id: string) {
      return self.products.find((product) => product.id === id)
    },
    get userPurchases() {
      return self.currentUserId 
        ? self.purchases.filter((purchase) => purchase.buyerId === self.currentUserId)
        : []
    },
    get userListings() {
      return self.currentUserId
        ? self.products.filter((product) => product.sellerId === self.currentUserId)
        : []
    }
  }))
  .actions((self) => ({
    setRootStore(rootStore: RootStore) {
      (self as any).rootStore = rootStore
    },
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
    addPurchase(purchase: typeof PurchaseModel.Type) {
      self.purchases.push(purchase)
      const product = self.getProductById(purchase.productId)
      if (product) {
        product.quantity -= purchase.quantity
        if (product.quantity <= 0) {
          product.status = "sold"
        }
      }
    },
    updatePurchaseStatus(purchaseId: string, status: string) {
      const purchase = self.purchases.find(p => p.id === purchaseId)
      if (purchase) {
        purchase.status = status as any
      }
    },
    reset() {
      self.products.clear()
      self.purchases.clear()
      self.isLoading = false
    }
  }))

export interface MarketplaceStore extends Instance<typeof MarketplaceStoreModel> {}
export interface MarketplaceStoreSnapshot extends SnapshotOut<typeof MarketplaceStoreModel> {}