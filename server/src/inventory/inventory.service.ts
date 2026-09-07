import {
  BadRequestException,
  Injectable,
  NotFoundException,
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

  async getProducts(): Promise<Product[]> {
    return this.prisma.product.findMany();
  }
}
