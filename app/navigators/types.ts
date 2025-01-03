export type AppStackParamList = {
  // Main Screens
  Home: undefined;
  Equipment: undefined;
  Marketplace: undefined;
  Profile: undefined;
  
  // Equipment Screens
  AddEquipment: undefined;
  EquipmentDetails: { equipmentId: string };
  
  // Marketplace Screens
  ProductDetails: { productId: string };
  AddProduct: undefined;
  
  // Crop Analysis Screens
  CropAnalysis: { cropId?: string };
  CropDetails: { cropId: string };
  
  // Payment Screens
  Payment: { amount?: number; description?: string };
  PaymentStatus: { paymentId: string };
  PaymentHistory: undefined;
};
