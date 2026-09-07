import { Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service.js';
import { Order, ORDER_STATUS } from './interfaces/order.interface.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
  private orders: Order[] = [];

  constructor(private readonly inventoryService: InventoryService) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    for (const item of dto.items) {
      await this.inventoryService.reserveStockPessimistic(
        item.productId,
        item.quantity,
      );
    }

    const newOrder: Order = {
      id: (this.orders.length + 1).toString(),
      items: dto.items,
      deliveryAddress: dto.deliveryAddress,
      paymentMethod: dto.paymentMethod,
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
