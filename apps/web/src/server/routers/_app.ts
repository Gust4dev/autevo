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
import { inspectionRouter } from './inspection';
import { scheduleRouter } from './schedule';
import { adminRouter } from './admin';
import { reportRouter } from './report';
import { backupRouter } from './backup';
import { notificationRouter } from './notification';
import { tenantRouter } from './tenant';
import { benchmarkRouter } from './benchmarks';
import { billingRouter } from './billing';

export const appRouter = router({
    admin: adminRouter,
    health: healthRouter,
    customer: customerRouter,
    vehicle: vehicleRouter,
    service: serviceRouter,
    product: productRouter,
    order: orderRouter,
    user: userRouter,
    settings: settingsRouter,
    dashboard: dashboardRouter,
    inspection: inspectionRouter,
    schedule: scheduleRouter,
    notification: notificationRouter,
    tenant: tenantRouter,
    report: reportRouter,
    backup: backupRouter,
    benchmark: benchmarkRouter,
    billing: billingRouter,
});


export type AppRouter = typeof appRouter;


