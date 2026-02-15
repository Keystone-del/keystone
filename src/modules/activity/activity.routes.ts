import { FastifyInstance } from "fastify";

//Handlers
import {
  deleteActivityHandler,
  fetchActivitiesHandler,
  fetchAdminActivitiesHandler,
} from "./activity.controller";

//Schemas
import { generalRef, PaginationInput } from "../general/general.schema";
import {
  activityRef,
  DeleteActivityInput,
  FetchAdminActivitiesInput,
} from "./activity.schema";

export default async function activityRoutes(app: FastifyInstance) {
  //Fetch activities
  app.get<{ Querystring: PaginationInput }>(
    "/get",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Activities", "Admins"],
        security: [{ bearerAuth: [] }],
        querystring: generalRef("paginationSchema"),
        response: {
          401: generalRef("unauthorizedSchema"),
          403: generalRef("forbiddenSchema"),
        },
      },
    },
    fetchActivitiesHandler
  );

  //Fetch an admin activities
  app.get<{ Params: FetchAdminActivitiesInput }>(
    "/adminActivities/:adminId",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Activities", "Admins"],
        security: [{ bearerAuth: [] }],
        params: activityRef("fetchAdminActivitiesSchema"),
        response: {
          401: generalRef("unauthorizedSchema"),
          403: generalRef("forbiddenSchema"),
        },
      },
    },
    fetchAdminActivitiesHandler
  );

  //Delete an activity
  app.delete<{ Params: DeleteActivityInput }>(
    "/delete/:activityId",
    {
      preHandler: app.authenticateAdmin,
      schema: {
        tags: ["Activities", "Admins"],
        security: [{ bearerAuth: [] }],
        params: activityRef("deleteActivitySchema"),
        response: {
          401: generalRef("unauthorizedSchema"),
          403: generalRef("forbiddenSchema"),
        },
      },
    },
    deleteActivityHandler
  );
}
