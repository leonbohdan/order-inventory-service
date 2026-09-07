import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayNotEmpty,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEnum,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  PAYMENT_METHOD,
  type PaymentMethod,
} from '../interfaces/order.interface.js';

export class OrderItemDto {
  @ApiProperty({ example: 'test-product-day5', description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1, description: 'Quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], description: 'Items in the order' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    example: '123 Main Street, Suite 100',
    description: 'Delivery address',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  deliveryAddress: string;

  @ApiProperty({
    enum: PAYMENT_METHOD,
    example: PAYMENT_METHOD.CARD,
    description: 'Payment method',
  })
  @IsEnum(PAYMENT_METHOD)
  paymentMethod: PaymentMethod;
}
