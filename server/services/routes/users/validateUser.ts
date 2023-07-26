import { Request, Response } from "express";
import status from "statuses";
import { verifications } from "../../../database/database";
import {
  IVerification,
  VerificationManager,
} from "../../verification/handleVerification";
import { QueryWithHelpers } from "mongoose";
import { LoggerService } from "../../../helpers/LoggerService";

export async function validateUser(req: Request, res: Response) {
  if (!req.body)
    return res.status(400).send({
      status: 400,
      statusText: status.message[400],
      data: null,
    });

  const verificationKey = req.body.key;
  const osuToken = req.body.osuToken;
  const Logger = new LoggerService(req.path);

  if (
    !verificationKey ||
    !osuToken ||
    typeof verificationKey != "string" ||
    typeof osuToken != "string" ||
    String(verificationKey).trim().length < 1 ||
    String(osuToken).trim().length < 1
  )
    return res.status(400).send({
      status: 400,
      statusText: status.message[400],
      data: null,
    });

  const targetVerification = await verifications.findOne({
    key: verificationKey,
  });

  if (!targetVerification)
    return res.status(404).send({
      status: 404,
      statusText: status.message[404],
      data: null,
    });

  const verification = new VerificationManager({
    verification: targetVerification as unknown as QueryWithHelpers<
      unknown,
      {},
      IVerification
    >,
    osuCode: osuToken,
  });

  const member = await verification.fetchMember();

  if (member.status != 200) {
    Logger.printError(`Error during member verification: ${member.status}`);

    return res.status(member.status).send(member);
  }

  const response = await verification.validateUser();

  if (response.status == 200) {
    Logger.printSuccess(`User ${targetVerification.userId} verified!`);
  } else {
    Logger.printError(`Error during member verification: ${response.status}`);
  }

  res.status(response.status).send(response);
}
