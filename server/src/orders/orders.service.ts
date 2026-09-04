import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service.js';
import { Order, ORDER_STATUS } from './interfaces/order.interface.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
  private orders: Order[] = [];

  constructor(private readonly inventoryService: InventoryService) {}

  createOrder(dto: CreateOrderDto): Order {
    for (const item of dto.items) {
      if (
        !this.inventoryService.checkAvailability(item.productId, item.quantity)
      ) {
        throw new BadRequestException(
          `Product with ID ${item.productId} is out of stock or insufficient quantity.`,
        );
      }
    }

    for (const item of dto.items) {
      this.inventoryService.reserve(item.productId, item.quantity);
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
