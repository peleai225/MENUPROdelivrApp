import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientRouter from "./client/index";
import restaurantsRouter from "./restaurants";
import { authenticate } from "../middlewares/auth";

const router: IRouter = Router();

// Populate req.customer from Bearer token on every request
router.use(authenticate);

router.use(healthRouter);
router.use("/client", clientRouter);
router.use("/restaurants", restaurantsRouter);

export default router;
