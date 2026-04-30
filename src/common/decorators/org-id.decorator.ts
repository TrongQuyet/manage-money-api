import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    return ctx.switchToHttp().getRequest().orgId;
  },
);
