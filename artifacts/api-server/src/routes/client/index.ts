import { Router, type IRouter } from "express";
import authRouter from "./auth";
import addressesRouter from "./addresses";
import ordersRouter from "./orders";
import paymentRouter from "./payment";

const router: IRouter = Router();

router.use("/auth", authRouter);
router.use("/addresses", addressesRouter);
router.use("/orders", ordersRouter);
router.use("/payment", paymentRouter);

export default router;
