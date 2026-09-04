import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ROLE, Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles([ROLE.ADMIN, ROLE.CUSTOMER, ROLE.MANAGER])
  createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get()
  @Roles([ROLE.ADMIN, ROLE.CUSTOMER, ROLE.MANAGER])
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }
}
