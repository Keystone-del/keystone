import { FastifyReply, FastifyRequest } from "fastify";
import path from "path";
import { randomUUID } from "crypto";

//Services
import {
  checkPendingOrActiveLoan,
  createLoan,
  deleteLoan,
  getLoans,
  getLoansByUser,
  updateLoanStatus,
} from "./loan.service";
import { findAdminById } from "../admin/admin.service";

//Schemas
import {
  CreateLoanInput,
  DeleteLoanInput,
  UpdateLoanInput,
} from "./loan.schema";
import { PaginationInput } from "../general/general.schema";

//Utils
import { sendResponse } from "../../utils/response.utils";
import { uploadFileToS3 } from "../../libs/upload";
import { emitAndSaveNotification } from "../../utils/socket";

//Configs
import { FILE_SIZE } from "../../config";

//Constants
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
const MAX_FILE_SIZE_BYTES = FILE_SIZE * 1024 * 1024;

//Create a new loan
export const loanApplicationHandler = async (
  request: FastifyRequest<{ Body: CreateLoanInput }>,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;

  //Check if a user has an pending or active loan
  const pendingOrActiveLoan = await checkPendingOrActiveLoan(
    decodedDetails._id
  );
  if (pendingOrActiveLoan)
    return sendResponse(
      reply,
      409,
      false,
      "You already have a pending or active loan."
    );

  const parts = request.parts();

  const documentUrls: string[] = [];
  let principal: number | undefined;
  let interestRate: number | undefined;
  let termInMonths: number | undefined;
  let collateral: string | undefined;

  for await (const part of parts) {
    if (part.type === "file") {
      if (!ALLOWED_MIME_TYPES.includes(part.mimetype)) {
        return sendResponse(
          reply,
          415,
          false,
          "Only JPG, PNG, and WEBP files are allowed."
        );
      }

      const buffer = await part.toBuffer();
      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        return sendResponse(
          reply,
          413,
          false,
          `Each file must be under ${FILE_SIZE}MB.`
        );
      }

      const ext = path.extname(part.filename || "");
      const filename = `loans/${randomUUID()}${ext}`;
      const fileUrl = await uploadFileToS3(filename, buffer, part.mimetype);
      documentUrls.push(fileUrl);
    } else if (part.type === "field" && typeof part.value === "string") {
      const val = part.value.trim();
      if (part.fieldname === "principal") {
        principal = parseFloat(val);
      } else if (part.fieldname === "interestRate") {
        interestRate = parseFloat(val);
      } else if (part.fieldname === "termInMonths") {
        termInMonths = parseInt(val);
      } else if (part.fieldname === "collateral") {
        collateral = val;
      }
    }
  }

  if (
    principal === undefined ||
    isNaN(principal) ||
    interestRate === undefined ||
    isNaN(interestRate) ||
    termInMonths === undefined ||
    isNaN(termInMonths)
  ) {
    return sendResponse(
      reply,
      400,
      false,
      "Loan principal, interest rate, and term duration are required."
    );
  }

  const loan = await createLoan(decodedDetails._id, {
    principal,
    interestRate,
    termInMonths,
    collateral,
    documents: documentUrls,
  });

  await emitAndSaveNotification({
    user: decodedDetails._id,
    type: "transaction",
    subtype: "application",
    title: "Loan Application Submitted",
    message: `Your loan request of $${principal.toLocaleString()} has been submitted and is currently under review.`,
  });

  return sendResponse(
    reply,
    201,
    true,
    "Loan application submitted successfully.",
    loan
  );
};

//Fetch a user's loan
export const getUserLoanHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;
  const userId = decodedDetails._id;

  //Fetch user loans and return
  const userLoan = await getLoansByUser(userId);
  return sendResponse(
    reply,
    200,
    true,
    "User loans was fetched successfully",
    userLoan
  );
};

//Admin

//Get all loans
export const getLoanRequestsHandler = async (
  request: FastifyRequest<{ Querystring: PaginationInput }>,
  reply: FastifyReply
) => {
  const { page = "1", limit = "10" } = request.query;

  const decodedAdmin = request.admin!;
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      401,
      false,
      "Sorry, but you are not authorized to perform this action"
    );

  const result = await getLoans(parseInt(page), parseInt(limit));
  return sendResponse(reply, 200, true, "Loan requests fetched", result);
};

//Update Loan Requests
export const updateLoanHandler = async (
  request: FastifyRequest<{ Body: UpdateLoanInput }>,
  reply: FastifyReply
) => {
  const body = request.body;
  const decodedAdmin = request.admin!;
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      401,
      false,
      "Sorry, but you are not authorized to perform this action"
    );
  if (admin.role !== "super_admin")
    return sendResponse(
      reply,
      403,
      false,
      "Sorry, you are not authorized enough to perform this action"
    );

  //Update Loan Status and return
  const updatedLoan = await updateLoanStatus(body);
  return sendResponse(
    reply,
    200,
    true,
    "Loan status was updated successfully.",
    updatedLoan
  );
};

//Delete Loan Request
export const deleteLoanRequestHandler = async (
  request: FastifyRequest<{ Params: DeleteLoanInput }>,
  reply: FastifyReply
) => {
  const decodedAdmin = request.admin!;
  const admin = await findAdminById(decodedAdmin?._id);
  if (!admin)
    return sendResponse(
      reply,
      401,
      false,
      "Sorry, but you are not authorized to perform this action"
    );
  if (admin.role !== "super_admin")
    return sendResponse(
      reply,
      403,
      false,
      "Sorry, you are not authorized enough to perform this action"
    );

  const deleted = await deleteLoan(request.params.loanId);
  if (!deleted)
    return sendResponse(
      reply,
      400,
      false,
      "Couldn't delete loan, kindly try again later"
    );
  return sendResponse(reply, 204, true, "Loan request was deleted", deleted);
};
