import { Request, Response } from "express";

export async function getCallbackURL(_req: Request, res: Response) {
  return res.status(200).send({
    status: 200,
    statusText: "Success",
    data: `https://osu.ppy.sh/oauth/authorize?client_id=${process.env.OSU_CLIENT_ID}&redirect_uri=${process.env.OSU_CALLBACK_URL}&response_type=code&scope=identify`,
  });
}
