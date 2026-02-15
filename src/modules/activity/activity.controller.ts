import { FastifyRequest, FastifyReply } from "fastify";

//Services
import { findAdminById } from "../admin/admin.service";
import {
  getActivitiesByAdmin,
  getAllActivities,
  deleteActivity,
} from "./activity.services";

//Schemas
import { PaginationInput } from "../general/general.schema";

//Utils
import { sendResponse } from "../../utils/response.utils";
import {
  DeleteActivityInput,
  FetchAdminActivitiesInput,
} from "./activity.schema";

//Fetch all activities
export const fetchActivitiesHandler = async (
  request: FastifyRequest<{ Querystring: PaginationInput }>,
  reply: FastifyReply
) => {
  const { page = "1", limit = "10" } = request.query;
  const decodedAdmin = request.admin!;

  //Fetch admin and make sure he is a super admin
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      401,
      false,
      "Sorry, but you are not authorized to perform this action"
    );
  if (admin.role !== "super_admin")
    return sendResponse(
      reply,
      403,
      false,
      "Sorry, you are not authorized enough to perform this action"
    );

  //Fetch activities and return
  const activities = await getAllActivities(parseInt(page), parseInt(limit));

  return sendResponse(
    reply,
    200,
    true,
    "Activities were fetched successfully",
    activities
  );
};

//Fetch An Admin Activities
export const fetchAdminActivitiesHandler = async (
  request: FastifyRequest<{ Params: FetchAdminActivitiesInput }>,
  reply: FastifyReply
) => {
  const decodedAdmin = request.admin!;
  const adminId = request.params.adminId;

  //Fetch admin and make sure he is a super admin
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      401,
      false,
      "Sorry, but you are not authorized to perform this action"
    );
  if (admin.role !== "super_admin")
    return sendResponse(
      reply,
      403,
      false,
      "Sorry, you are not authorized enough to perform this action"
    );

  //Fetch activities and return
  const activities = await getActivitiesByAdmin(adminId);

  return sendResponse(
    reply,
    200,
    true,
    "Activities were fetched successfully",
    activities
  );
};

//Delete an activity
export const deleteActivityHandler = async (
  request: FastifyRequest<{ Params: DeleteActivityInput }>,
  reply: FastifyReply
) => {
  const decodedAdmin = request.admin!;
  const activityId = request.params.activityId;

  //Fetch admin and make sure he is a super admin
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      401,
      false,
      "Sorry, but you are not authorized to perform this action"
    );
  if (admin.role !== "super_admin")
    return sendResponse(
      reply,
      403,
      false,
      "Sorry, you are not authorized enough to perform this action"
    );

  //Delete and return value
  const deleted = await deleteActivity(activityId);
  if (!deleted)
    return sendResponse(
      reply,
      400,
      false,
      "Couldn't delete activity, kindly try again later"
    );
  return sendResponse(reply, 204, true, "Activity was deleted successfully.");
};
