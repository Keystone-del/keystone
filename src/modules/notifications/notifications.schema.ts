import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

//Schemas
import { responseCore } from "../general/general.schema";

const notificationCore = {
  _id: z.string(),
  user: z.string(),
  type: z.string(),
  subtype: z.string().optional(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
};

export const createNotificationSchema = z.object({
  type: z.string(),
  subtype: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
});

export const readNotificationSchema = z.object({
  notificationId: z.string({
    required_error: "Notification Id is required",
  }),
});

export const generalNotificationResponseSchema = z.object({
  ...responseCore,
  data: z.object(notificationCore),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ReadNotificationInput = z.infer<typeof readNotificationSchema>;

export const { schemas: notificationSchemas, $ref: notificationRef } =
  buildJsonSchemas(
    {
      createNotificationSchema,
      readNotificationSchema,
      generalNotificationResponseSchema,
    },
    { $id: "NotificationSchema" }
  );
