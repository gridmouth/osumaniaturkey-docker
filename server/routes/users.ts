import { Router } from "express";
import { validateUser } from "../services/routes/users/validateUser";

const router = Router();

router.post("/validate", validateUser);

export const UserRouter = router;
