import { Request, Response } from "express";

export async function getDiscordCallback(_req: Request, res: Response) {
  return res.status(200).send({
    status: 200,
    statusText: "Success",
    data: `discord://channels/${process.env.DISCORD_GUILD}/${process.env.DISCORD_CHANNEL}`,
  });
}
