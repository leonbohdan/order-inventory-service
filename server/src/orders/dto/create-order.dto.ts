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
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  deliveryAddress: string;

  @IsEnum(PAYMENT_METHOD)
  paymentMethod: PaymentMethod;
}
