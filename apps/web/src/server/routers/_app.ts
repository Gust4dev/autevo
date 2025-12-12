import { router } from '../trpc';
import { healthRouter } from './health';
import { customerRouter } from './customer';
import { vehicleRouter } from './vehicle';
import { serviceRouter } from './service';
import { productRouter } from './product';
import { orderRouter } from './order';
import { userRouter } from './user';
import { settingsRouter } from './settings';
import { dashboardRouter } from './dashboard';

export const appRouter = router({
    health: healthRouter,
    customer: customerRouter,
    vehicle: vehicleRouter,
    service: serviceRouter,
    product: productRouter,
    order: orderRouter,
    user: userRouter,
    settings: settingsRouter,
    dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;


