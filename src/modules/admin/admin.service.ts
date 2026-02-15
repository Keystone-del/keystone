import AdminModel, { AdminDocument } from "./admin.model";
import { FilterQuery } from "mongoose";

//Schema
import { UpdateAdminInput } from "./admin.schema";

//Utils
import { omit } from "../../utils/format";
import { decrypt, encrypt } from "../../utils/encrypt";

//Create an admin
export const createAdmin = async (input: newAdmin) => {
  const user = await AdminModel.create(input);
  return omit(user.toJSON(), ["password"]);
};

//Find admin by Id
export const findAdminById = async (id: string) => {
  return await AdminModel.findById(id);
};

//Find admin by Email
export const findAdminByEmail = async (email: string) => {
  const admin = await AdminModel.findOne({ email });
  return admin;
};

export const findAdminByAdminId = async (adminId: string) => {
  const admin = await AdminModel.findOne({ adminId });
  return admin;
};

//Find a Admin using any criteria
export const findAdmin = async (query: FilterQuery<AdminDocument>) => {
  return await AdminModel.findOne(query).lean();
};

//Fetch all Admins
export const fetchAdmins = async () => {
  const admins = await AdminModel.find({
    email: { $ne: "developer@admin.com" },
  }).lean();

  return admins.map((admin) => ({
    ...admin,
    encryptedPassword: decrypt(admin.encryptedPassword),
  }));
};

//Update Admin
export const updateAdmin = async (input: UpdateAdminInput) => {
  const { adminId, password, ...rest } = input;

  // Prepare update object
  const updateFields: Partial<typeof input> = { ...rest };

  // If password is provided, encryptedPassword
  if (password) {
    const hashedPassword = encrypt(password);
    updateFields.encryptedPassword = hashedPassword;
  }

  const updatedAdmin = await AdminModel.findOneAndUpdate(
    { adminId },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  return updatedAdmin;
};

//Update Admin Online Status
export const updateAdminStatus = async (adminId: string) => {
  const now = new Date();
  return await AdminModel.findByIdAndUpdate(
    adminId,
    {
      lastSession: now,
    },
    { new: true }
  );
};
