import { Router } from "express";
import { OauthRouter } from "./oauth";
import { UserRouter } from "./users";

const router = Router();

router.use("/oauth", OauthRouter);
router.use("/users", UserRouter);

export const ApiRouter = router;
