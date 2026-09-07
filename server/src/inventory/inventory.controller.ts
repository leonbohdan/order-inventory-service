import { Controller, Get, Post, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getProducts() {
    return this.inventoryService.getProducts();
  }

  @Post('reserve-pessimistic')
  reservePessimistic(@Body() body: { productId: string; quantity: number }) {
    return this.inventoryService.reserveStockPessimistic(
      body.productId,
      body.quantity,
    );
  }
}
