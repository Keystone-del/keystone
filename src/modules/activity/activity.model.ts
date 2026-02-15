import { Schema, model, Types } from "mongoose";

export type ActivityDocument = Document & {
  admin: Types.ObjectId;
  action: string;
  target: Types.ObjectId;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};

const activitySchema = new Schema<ActivityDocument>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    action: { type: String, required: true },
    target: { type: Schema.Types.ObjectId, ref: "User" },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ActivityModel = model<ActivityDocument>(
  "Activity",
  activitySchema
);
