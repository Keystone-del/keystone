import { z } from "zod";
import { Types } from "mongoose";
import { buildJsonSchemas } from "fastify-zod";

//General Schema
import { responseCore } from "../general/general.schema";

const activityCore = {
  admin: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  }),
  action: z.string(),
  target: z.string().optional(),
  metadata: z.record(z.any()).optional(),
};

const createActivitySchema = z.object({ ...activityCore });

const fetchAdminActivitiesSchema = z.object({
  adminId: z.string({
    required_error: "Admin Id is required",
  }),
});

const deleteActivitySchema = z.object({
  activityId: z.string({
    required_error: "Activity Id is required",
  }),
});

//General Response Core
const generalActivityResponse = z.object({
  ...responseCore,
  data: z.array(
    z.object({ ...activityCore, createdAt: z.string().datetime() })
  ),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type FetchAdminActivitiesInput = z.infer<
  typeof fetchAdminActivitiesSchema
>;
export type DeleteActivityInput = z.infer<typeof deleteActivitySchema>;

export const { schemas: activitySchemas, $ref: activityRef } = buildJsonSchemas(
  {
    createActivitySchema,
    fetchAdminActivitiesSchema,
    deleteActivitySchema,
    generalActivityResponse,
  }
);
