export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_METHOD = {
  CARD: 'card',
  CASH: 'cash',
  CRYPTO: 'crypto',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: Date;
}
