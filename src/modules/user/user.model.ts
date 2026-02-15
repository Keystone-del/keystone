import mongoose, { Schema, model, Document } from "mongoose";
import bcrypt from "bcrypt";

// Utils and configs
import { customAlphabet } from "nanoid";
import { generateAccountNumber } from "../../utils/generate";

// Generate a verification code, and unique accountId with nanoid
const generateVerificationCode = customAlphabet("0123456789", 6);
const generateAccountId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  10
);

export type UserDocument = Document & {
  email: string;
  fullName: string;
  accountNumber: string;
  password: string;
  accountId: string;
  phoneNumber: string;
  country: string;
  address: string;
  kyc: {
    images: string[];
    idType: string;
    status: "pending" | "accepted" | "rejected";
    lastSubmissionDate: Date;
  };
  profilePicture: string;
  gender: "male" | "female" | "prefer not to say";
  verificationCode: string;
  verificationCodeExpiry: Date;
  passwordResetCode: string | null;
  isVerified: boolean;
  isFullyVerified: boolean;
  isSuspended: boolean;
  suspendedDate: Date | null;
  encryptedPassword: string;
  minimumTransfer: number | null;
  transferPin: string | null;
  freezeCard: boolean;
  transactionSuspended: boolean;
  location: {
    type: "Point";
    coordinates: number[];
  };
  generatedDetails: {
    generatedCountry: string;
    generatedState: string;
    generatedAddress: string;
  };
  lastSession: Date;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateNewVerificationCode(): Promise<string>;
};

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    fullName: { type: String, required: true, lowercase: true },
    accountNumber: { type: String, unique: true },
    password: { type: String, required: true },
    accountId: { type: String, unique: true },
    phoneNumber: { type: String, required: true },
    country: { type: String, required: true },
    address: { type: String },
    kyc: {
      images: { type: [String] },
      idType: { type: String },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      lastSubmissionDate: { type: Date },
    },
    profilePicture: { type: String },
    gender: { type: String },
    verificationCode: {
      type: String,
      required: true,
      default: () => generateVerificationCode(),
    },
    verificationCodeExpiry: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 60 * 1000),
    },
    passwordResetCode: { type: String },
    isVerified: { type: Boolean, default: false },
    isFullyVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendedDate: { type: Date, default: null },
    encryptedPassword: { type: String, required: true },
    minimumTransfer: { type: Number, default: null },
    transferPin: { type: String, default: null },
    freezeCard: { type: Boolean, default: false },
    transactionSuspended: { type: Boolean, default: false },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    generatedDetails: {
      generatedCountry: { type: String },
      generatedState: { type: String },
      generatedAddress: { type: String },
    },
    lastSession: { type: Date },
    isOnline: { type: Boolean },
  },
  {
    timestamps: true,
  }
);

// Pre-save hooks, methods and validation functions

// Generate unique accountId before creation
userSchema.pre("save", async function (next) {
  if (this.isNew && !this.accountId) {
    let isUnique = false;
    while (!isUnique) {
      const newAccountId = "CB" + generateAccountId();
      const existingUser = await UserModel.findOne({ accountId: newAccountId });
      if (!existingUser) {
        this.accountId = newAccountId;
        isUnique = true;
      }
    }
  }
  next();
});

//Generate Account Number
userSchema.pre("save", async function (next) {
  if (this.isNew && !this.accountNumber) {
    let unique = false;

    while (!unique) {
      const newAccountNumber = generateAccountNumber();
      const existingUser = await UserModel.findOne({
        accountNumber: newAccountNumber,
      });
      if (!existingUser) {
        this.accountNumber = newAccountNumber;
        unique = true;
      }
    }
  }
  next();
});

// Hashing of Password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

// Methods
// Comparing passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password).catch(() => false);
};

// Generating new verification code
userSchema.methods.generateNewVerificationCode =
  async function (): Promise<string> {
    this.verificationCode = generateVerificationCode();
    this.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await this.save();
    return this.verificationCode;
  };

userSchema.index({ location: "2dsphere" });

const UserModel = model<UserDocument>("User", userSchema);
export default UserModel;
