import mongoose, { Document, Schema, model } from "mongoose";

export type NotificationDocument = Document & {
  user: mongoose.Types.ObjectId;
  type: string;
  subtype?: string;
  title: string;
  message: string;
  data: {
    transactionId?: string;
    amount?: number;
    balance?: number;
    date?: Date;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
};

const notificationSchema = new Schema<NotificationDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, default: "system" },
    subtype: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const NotificationModel = model<NotificationDocument>(
  "Notification",
  notificationSchema
);

export default NotificationModel;
