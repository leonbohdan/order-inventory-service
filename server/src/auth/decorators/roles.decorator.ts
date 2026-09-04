import { Reflector } from '@nestjs/core';

export const ROLE = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  MANAGER: 'manager',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const Roles = Reflector.createDecorator<Role[]>();
