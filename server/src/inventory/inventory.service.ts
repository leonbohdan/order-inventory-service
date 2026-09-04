import { Injectable } from '@nestjs/common';
import { Product } from './interfaces/product.interface.js';

@Injectable()
export class InventoryService {
  private products: Product[] = [
    { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Laptop', quantity: 5, price: 1200 },
    { id: 'b1eecf10-9d0c-4ef8-bb6d-6bb9bd380a12', name: 'Wireless Mouse', quantity: 15, price: 25 },
    { id: 'c2eecf10-9d0c-4ef8-bb6d-6bb9bd380a13', name: 'Mechanical Keyboard', quantity: 2, price: 100 },
  ];

  checkAvailability(productId: string, quantity: number): boolean {
    if (quantity <= 0) return false;

    const product = this.products.find((p) => p.id === productId);

    if (!product) return false;

    return product.quantity >= quantity;
  }

  reserve(productId: string, quantity: number): boolean {
    if (!this.checkAvailability(productId, quantity)) return false;

    const product = this.products.find((p) => p.id === productId);

    if (!product) return false;

    product.quantity -= quantity;

    return true;
  }

  getProducts(): Product[] {
    return this.products;
  }
}
