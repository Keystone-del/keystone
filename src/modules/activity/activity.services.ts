import { ActivityModel } from "./activity.model";

//Schemas
import { CreateActivityInput } from "./activity.schema";

//Create new Activity Log
export async function newActivity(input: CreateActivityInput) {
  return await ActivityModel.create(input);
}

//Get All Activities
export async function getAllActivities(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    ActivityModel.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("admin", "email role lastSession"),
    ActivityModel.countDocuments(),
  ]);

  return {
    data: activities,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  };
}

//Get an admin activities
export async function getActivitiesByAdmin(adminId: string) {
  return await ActivityModel.find({ admin: adminId })
    .sort({ timestamp: -1 })
    .lean();
}

//Delete an activity
export const deleteActivity = async (activityId: string) => {
  return await ActivityModel.findByIdAndDelete(activityId);
};
