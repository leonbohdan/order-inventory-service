import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Product } from '../generated/prisma/client.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async reserveStockPessimistic(
    productId: string,
    quantity: number,
  ): Promise<Product> {
    return this.prisma.$transaction(async (tx) => {
      const [product] = await tx.$queryRaw<Product[]>`
      SELECT * FROM "Product" WHERE id = ${productId} FOR UPDATE
    `;

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      if (product.stockQuantity < quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.title}. Available: ${product.stockQuantity}, requested: ${quantity}`,
        );
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: product.stockQuantity - quantity,
        },
      });

      return updatedProduct;
    });
  }

  async reserveStockOptimistic(
    productId: string,
    quantity: number,
  ): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    if (product.stockQuantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${product.title}. Available: ${product.stockQuantity}, requested: ${quantity}`,
      );
    }

    const result = await this.prisma.product.updateMany({
      where: {
        id: productId,
        version: product.version,
      },
      data: {
        stockQuantity: { decrement: quantity },
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new ConflictException(
        `Concurrent update conflict for product ${product.title}. Please try again.`,
      );
    }

    return (await this.prisma.product.findUnique({
      where: { id: productId },
    }))!;
  }

  async getProducts(): Promise<Product[]> {
    return this.prisma.product.findMany();
  }
}
