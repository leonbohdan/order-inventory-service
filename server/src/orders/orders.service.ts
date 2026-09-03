import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service.js';
import { Order, ORDER_STATUS } from './interfaces/order.interface.js';

@Injectable()
export class OrdersService {
  private orders: Order[] = [];

  constructor(private readonly inventoryService: InventoryService) {}

  createOrder(productId: string, quantity: number): Order {
    const isReserved = this.inventoryService.reserve(productId, quantity);

    if (!isReserved) {
      throw new BadRequestException(
        `Product with ID ${productId} is out of stock or insufficient quantity.`,
      );
    }

    const newOrder: Order = {
      id: (this.orders.length + 1).toString(),
      productId,
      quantity,
      status: ORDER_STATUS.PENDING,
      createdAt: new Date(),
    };

    this.orders.push(newOrder);
    return newOrder;
  }

  getAllOrders(): Order[] {
    return this.orders;
  }
}
