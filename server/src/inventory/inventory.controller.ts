import { Controller, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getProducts() {
    return this.inventoryService.getProducts();
  }
}
