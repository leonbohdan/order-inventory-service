import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserPayload {
  id?: string;
  role?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user: UserPayload = {
      id: request.headers['x-user-id'] as string | undefined,
      role: request.headers['x-user-role'] as string | undefined,
    };

    if (data) {
      return user[data];
    }

    return user;
  },
);
