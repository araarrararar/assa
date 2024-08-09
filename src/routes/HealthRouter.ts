import express from "express";
import DumpCloudWatchLogs from "../utils/cloudwatch";

const healthRouter = express.Router();

healthRouter.route("/healthcheck").get(async (request, response) => {
  DumpCloudWatchLogs("iuddfiuweanfpeha", "message");
  response.status(200).send({
    name: "copilot-middleware",
    status: "Copilot middleware is available!",
  });
});

export default healthRouter;
