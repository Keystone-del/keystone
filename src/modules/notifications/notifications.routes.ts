import { FastifyInstance } from "fastify";

//Handlers
import {
  deleteNotificationHandler,
  getNotificationsHandler,
} from "./notifications.controller";

//Schemas
import { notificationRef, ReadNotificationInput } from "./notifications.schema";
import { generalRef } from "../general/general.schema";

export default async function notificationRoutes(app: FastifyInstance) {
  //Get user notifications
  app.get(
    "/getNotifications",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Notifications", "Users"],
        security: [{ bearerAuth: [] }],
      },
    },
    getNotificationsHandler
  );

  //Delete notification
  app.delete<{ Params: ReadNotificationInput }>(
    "/delete/:notificationId",
    {
      preHandler: app.authenticate,
      schema: {
        tags: ["Notifications", "Users"],
        security: [{ bearerAuth: [] }],
        params: notificationRef("readNotificationSchema"),
        response: {
          200: generalRef("responseSchema"),
          404: generalRef("unavailableSchema"),
        },
      },
    },
    deleteNotificationHandler
  );
}
