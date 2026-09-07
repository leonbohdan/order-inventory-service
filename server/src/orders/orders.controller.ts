import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ROLE, Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('orders')
@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles([ROLE.ADMIN, ROLE.CUSTOMER, ROLE.MANAGER])
  @ApiOperation({ summary: 'Create new order and reserve inventory items' })
  @ApiHeader({
    name: 'x-user-role',
    description: 'User role (customer, admin, manager)',
    required: true,
    example: 'customer',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User UUID',
    required: false,
    example: '1babcc42-f284-4278-9caf-0f7d7b442b12',
  })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden: Insufficient role' })
  createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get()
  @Roles([ROLE.ADMIN, ROLE.CUSTOMER, ROLE.MANAGER])
  @ApiOperation({ summary: 'Get all orders' })
  @ApiHeader({
    name: 'x-user-role',
    description: 'User role (customer, admin, manager)',
    required: true,
    example: 'admin',
  })
  @ApiResponse({ status: 200, description: 'List of all orders' })
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }
}
