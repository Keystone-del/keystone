//For the Response
declare type IGenericObject = {
  [key: string]: any;
};

declare type PaginatedData<T> = {
  total: number;
  page: number;
  pageSize: number;
  results: T[];
};

declare type ResponseData<T> = T | PaginatedData<T>;

declare type ApiResponse<T = any> = {
  status: number;
  success: boolean;
  message: string;
  data?: T;
};

//Users
declare type User = {
  _id: any;
  fullName: string;
  accountNumber: string;
  accountId: string;
  email: string;
  phoneNumber: string;
  country: string;
  profilePicture: string;
  gender: "male" | "female" | "prefer not to say";
  isVerified: boolean;
  isFullyVerified: boolean;
  isSuspended: boolean;
  suspendedDate: Date | null;
  minimumTransfer: number | null;
  lastSession: Date;
  createdAt: Date;
};

//Login Details
declare type IPInfo = {
  error?: boolean;
  city?: string;
  region?: string;
  region_name?: string;
  country?: string;
  country_name?: string;
  timezone?: string;
};

//Create new user
declare type newUser = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  country: string;
  encryptedPassword: string;
};

//Admin
declare type Admin = {
  _id: any;
  email: string;
  password: string;
  role: "admin" | "super_admin";
  isSuspended: boolean;
  lastSession: Date;
  createdAt: Date;
};

//Create new admin
declare type newAdmin = {
  password: string;
  email: string;
  role?: string | undefined;
  encryptedPassword: string;
};

//KYC Email Props
declare type KycEmailParams = {
  name: string;
  status: "accepted" | "rejected";
  reason?: string;
};

//Card Request
declare type CardRequestEmailParams = {
  name: string;
  status: "pending" | "successful" | "declined";
  date: string;
};
