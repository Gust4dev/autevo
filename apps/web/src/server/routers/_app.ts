import { router } from '../trpc';
import { healthRouter } from './health';
import { customerRouter } from './customer';
import { vehicleRouter } from './vehicle';
import { serviceRouter } from './service';
import { productRouter } from './product';
import { orderRouter } from './order';
import { userRouter } from './user';

export const appRouter = router({
    health: healthRouter,
    customer: customerRouter,
    vehicle: vehicleRouter,
    service: serviceRouter,
    product: productRouter,
    order: orderRouter,
    user: userRouter,
});

export type AppRouter = typeof appRouter;


