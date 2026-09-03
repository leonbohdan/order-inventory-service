import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.ordersService.createOrder(productId, Number(quantity));
  }

  @Get()
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }
}
