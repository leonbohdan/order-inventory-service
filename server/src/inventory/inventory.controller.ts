import { Controller, Get, Post, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ReserveStockDto } from './dto/reserve-stock.dto.js';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with stock and version' })
  @ApiResponse({ status: 200, description: 'List of all products in stock' })
  getProducts() {
    return this.inventoryService.getProducts();
  }

  @Post('reserve-pessimistic')
  @ApiOperation({
    summary: 'Reserve stock using Pessimistic Locking (SELECT FOR UPDATE)',
  })
  @ApiResponse({ status: 201, description: 'Stock reserved successfully' })
  @ApiBadRequestResponse({
    description: 'Insufficient stock or invalid quantity',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  reservePessimistic(@Body() dto: ReserveStockDto) {
    return this.inventoryService.reserveStockPessimistic(
      dto.productId,
      dto.quantity,
    );
  }

  @Post('reserve-optimistic')
  @ApiOperation({
    summary: 'Reserve stock using Optimistic Locking (version CAS)',
  })
  @ApiResponse({ status: 201, description: 'Stock reserved successfully' })
  @ApiBadRequestResponse({
    description: 'Insufficient stock or invalid quantity',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiConflictResponse({
    description: 'Concurrent update conflict (Retry needed)',
  })
  reserveOptimistic(@Body() dto: ReserveStockDto) {
    return this.inventoryService.reserveStockOptimistic(
      dto.productId,
      dto.quantity,
    );
  }
}
