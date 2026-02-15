import { FastifyRequest, FastifyReply } from "fastify";
import fetch from "node-fetch";
import { app } from "../../app";

//Services
import { findUserByEmail } from "../user/user.service";
import { findAdminByEmail } from "../admin/admin.service";

//Schemas, templates
import { ChangePasswordInput, LoginUserInput, PasswordResetEmailInput, ResetPasswordInput, VerifyPasswordResetInput } from "./auth.schema";
import forgotPassword from "../../emails/forgotPassword";

//Utils, Configs
import { sendResponse } from "../../utils/response.utils";
import { customAlphabet } from "nanoid";
import { sendEmail } from "../../libs/mailer";
import { encrypt } from "../../utils/encrypt";

//Email Templates
import otp from "../../emails/otp";
import login from "../../emails/login";

//Fetch user location
export const getLoginDetails = async (request: FastifyRequest) => {
  const ip =
    request.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    request.ip ||
    "Unknown IP";

  const userAgent = request.headers["user-agent"] || "Unknown";

  let locationInfo = { city: "Unknown", region: "Unknown", country: "Unknown" };
  let timezone = "UTC";

  const isPrivateIP = (ip: string) =>
    /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|::1)/.test(ip);

  if (!isPrivateIP(ip)) {
    try {
      let res = await fetch(`https://ipapi.co/${ip}/json/`);
      let data = (await res.json()) as IPInfo;

      if (data.error || !data.country_name) {
        // fallback to another provider
        res = await fetch(`https://ipwho.is/${ip}`);
        data = (await res.json()) as IPInfo;
      }

      if (!data.error && (data.country_name || data.country)) {
        locationInfo = {
          city: data.city || "Unknown",
          region: data.region || data.region_name || "Unknown",
          country: data.country_name || data.country || "Unknown",
        };
        timezone = data.timezone || "UTC";
      }
    } catch (err) {
      console.log("Error fetching IP details:", err);
    }
  }

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return { ip, userAgent, location: locationInfo, date };
};

//Authenticate a user
export const loginHandler = async (request: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply) => {

  const { email, password } = request.body;

  //Fetch user by email
  const user = await findUserByEmail(email);
  if (!user) return sendResponse(reply, 400, false, "Incorrect Email or Password");

  //Compare password
  const isCorrect = await user.comparePassword(password);
  if (isCorrect) {
    // Generate 6 Random Digits and Save
    const randomSixNumbers = customAlphabet("0123456789", 6)();

    //Save the number to the database
    user.verificationCode = randomSixNumbers;
    await user.save();

    //Send otp to the email address with the 6 Digit
    const emailContent = otp({
      name: user.fullName,
      otp: randomSixNumbers,
      otpType: "Login Verification",
    });
    await sendEmail({
      to: user.email,
      subject: "Login Verification",
      html: emailContent.html,
    });

    return sendResponse(reply, 200, true, "For security purposes, a One-Time Password (OTP) has been dispatched to your email.")
  }

  return sendResponse(reply, 400, false, "Incorrect Email or Password");
};

//Validate Authentication
export const validateLoginHandler = async (request: FastifyRequest<{ Body: VerifyPasswordResetInput }>, reply: FastifyReply) => {

  const { email, otp } = request.body;

  //Fetch user
  const user = await findUserByEmail(email);
  if (!user) return sendResponse(reply, 400, false, "Authentication Unsuccessful: Kindly restart the process.");

  if (user.verificationCode !== otp) return sendResponse(reply, 400, false, "Authentication failed: Invalid OTP. Please try again.");

  const plainUser = user.toObject() as User;
  const loginDetails = await getLoginDetails(request);

  const loginTemplate = login({
    name: user.fullName,
    ip: loginDetails.ip,
    userAgent: loginDetails.userAgent,
    location: loginDetails.location,
    date: loginDetails.date,
  }).html;

  await sendEmail({
    to: user.email,
    subject: "New Login to Your Keystone  Bank Account",
    html: loginTemplate,
  });

  const redirect = !user.isVerified
    ? "verification"
    : !user.isFullyVerified
      ? "pending"
      : !user.kyc.lastSubmissionDate || user.kyc.status === "rejected"
        ? "kyc"
        : "user/dashboard";

  return sendResponse(reply, 200, true, "Authenticated successfully", {
    accessToken: app.jwt.sign(plainUser),
    redirect,
  });
};

//Send password reset otp
export const sendPasswordReset = async (request: FastifyRequest<{ Body: PasswordResetEmailInput }>, reply: FastifyReply) => {

  const { email } = request.body;

  //Fetch user by email, throw an error if it doesn't exist, or if the user hasn't verified their account
  const user = await findUserByEmail(email);
  if (!user) return sendResponse(reply, 400, false, "Incorrect Email");
  if (!user.isVerified)
    return sendResponse(
      reply,
      403,
      false,
      "Please verify your account before proceeding."
    );

  // Generate 6 Random Digits and Save
  const randomSixNumbers = customAlphabet("0123456789", 6)();

  //Save the number to the database
  user.passwordResetCode = randomSixNumbers;
  await user.save();

  //Send email to the email address with the 4 Digit
  const emailContent = forgotPassword({
    name: user.fullName,
    verificationCode: randomSixNumbers,
  });
  await sendEmail({
    to: user.email,
    subject: "Reset Password Verification",
    html: emailContent.html,
  });

  return sendResponse(reply, 200, true, "A verification code will be sent if the email address is registered.");
};

// Verify password reset otp
export const verifyPasswordResetHandler = async (request: FastifyRequest<{ Body: VerifyPasswordResetInput }>, reply: FastifyReply) => {

  const { email, otp } = request.body;

  //Fetch user and throw an error if user doesn't exist or entered a wrong OTP
  const user = await findUserByEmail(email);
  if (!user) return sendResponse(reply, 400, false, "User does not exist");
  if (user.passwordResetCode !== otp)
    return sendResponse(reply, 400, false, "Incorrect OTP");

  //Make the user password field null again
  user.passwordResetCode = "";
  await user.save();

  return sendResponse(reply, 200, true, "Email was verified successfully.");
};

//Create new password
export const passwordResetHandler = async (request: FastifyRequest<{ Body: ResetPasswordInput }>, reply: FastifyReply) => {

  const { email, password } = request.body;
  const user = await findUserByEmail(email);

  if (!user) return sendResponse(reply, 400, false, "User does not exist");

  //Save users new password
  const hashedPassword = encrypt(password);
  user.password = password;
  user.encryptedPassword = hashedPassword;
  await user.save();

  return sendResponse(reply, 200, true, "Your password was updated successfully.");
};

//Change password while being authenticated
export const changePasswordHandler = async (request: FastifyRequest<{ Body: ChangePasswordInput }>, reply: FastifyReply) => {

  const decodedDetails = request.user;
  const userEmail = decodedDetails.email;

  const { currentPassword, newPassword } = request.body;

  //Make sure the new password isn't the old one
  if (currentPassword === newPassword) return sendResponse(reply, 409, false, "Your new password must differ from your old one.");

  //Fetch user
  const user = await findUserByEmail(userEmail);
  if (!user) return sendResponse(reply, 400, false, "Something went wrong, please try again later.");

  //Compare users password and return response if it doesn't match
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return sendResponse(reply, 403, false, "Wrong Password.");

  //Update password
  const hashedPassword = encrypt(newPassword);
  user.password = newPassword;
  user.encryptedPassword = hashedPassword;
  await user.save();

  return sendResponse(reply, 200, true, "Your password was updated successfully.");
};

// Administrative Endpoint


// Authenticate Admin
export const adminLoginHandler = async (request: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply) => {

  const { email, password } = request.body;

  //Fetch user by email
  const admin = await findAdminByEmail(email);
  if (!admin) return sendResponse(reply, 400, false, "Incorrect Email or Password");

  //Compare password
  const isCorrect = await admin.comparePassword(password);
  if (isCorrect) {
    const plainAdmin = admin.toObject() as Admin;
    return sendResponse(reply, 200, true, "Authenticated successfully", {
      accessToken: app.jwt.sign(plainAdmin),
    });
  }

  return sendResponse(reply, 400, false, "Incorrect Email or Password");
};
