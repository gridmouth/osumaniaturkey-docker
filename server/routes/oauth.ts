import { Router } from "express";
import { getCallbackURL } from "../services/routes/oauth/getCallbackURL";
import { getDiscordCallback } from "../services/routes/oauth/getDiscordCallback";

const router = Router();

router.get("/callback", getCallbackURL);
router.get("/discord", getDiscordCallback);

export const OauthRouter = router;
