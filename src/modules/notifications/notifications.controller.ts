import { FastifyRequest, FastifyReply } from "fastify";

//Services
import {
  deleteNotification,
  getUserNotifications,
  isNotificationOwnedByUser,
} from "./notifications.services";

//Schemas
import { ReadNotificationInput } from "./notifications.schema";

//Utils
import { sendResponse } from "../../utils/response.utils";

//Get a user notifications
export const getNotificationsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;
  const user = decodedDetails._id;

  const notifications = await getUserNotifications(user);
  return sendResponse(
    reply,
    200,
    true,
    "Your notifications was fetched successfully",
    notifications
  );
};

//Delete a notification
export const deleteNotificationHandler = async (
  request: FastifyRequest<{ Params: ReadNotificationInput }>,
  reply: FastifyReply
) => {
  const { notificationId } = request.params;

  const decodedDetails = request.user;
  const user = decodedDetails._id;

  //Make sure it is the user that owns the notification
  const exists = await isNotificationOwnedByUser(notificationId, user);
  if (!exists)
    return sendResponse(
      reply,
      403,
      false,
      "Sorry, you can't perform this action"
    );

  const deleted = await deleteNotification(notificationId);

  if (!deleted) {
    return sendResponse(reply, 404, false, "Notification not found");
  }

  return sendResponse(
    reply,
    200,
    true,
    "Notification was deleted successfully"
  );
};
