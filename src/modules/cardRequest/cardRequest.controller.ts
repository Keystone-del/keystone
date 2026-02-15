import { FastifyRequest, FastifyReply } from "fastify";

//Services
import {
  createCardRequest,
  deleteCardRequest,
  getCardRequests,
  getUserCardRequest,
  updateCardRequest,
  userHasRequestedCard,
} from "./cardRequest.services";
import { findAdminById } from "../admin/admin.service";
import { findUserById } from "../user/user.service";
import { newActivity } from "../activity/activity.services";

//Schemas
import {
  DeleteCardRequestInput,
  UpdateCardRequestInput,
} from "./cardRequest.schema";
import { PaginationInput } from "../general/general.schema";

//Utils and Configs
import { sendResponse } from "../../utils/response.utils";
import {
  generateMastercardNumber,
  generateCVV,
  getDate,
} from "../../utils/generate";
import { sendEmail } from "../../libs/mailer";

//Templates
import { cardRequestEmail } from "../../emails/cardRequest";

//Create card request handler
export const createCardRequestHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;
  const user = decodedDetails._id;

  const userDetails = await findUserById(user);
  if (!userDetails)
    return sendResponse(
      reply,
      400,
      false,
      "User Details is currently unavailable, kindly try again."
    );

  const alreadyRequested = await userHasRequestedCard(user);
  if (alreadyRequested)
    return sendResponse(reply, 409, false, "User has already requested a card");

  const cardNumber = generateMastercardNumber();
  const cardCVV = generateCVV();
  const cardExpiryDate = getDate();

  const cardRequest = await createCardRequest(
    user,
    cardNumber,
    cardExpiryDate,
    cardCVV
  );
  if (!cardRequest)
    return sendResponse(
      reply,
      400,
      false,
      "Card Request was not processed successfully, kindly try again later."
    );

  const cardRequestEmailTemplate = cardRequestEmail({
    name: userDetails.fullName,
    date: new Date().toLocaleString(),
    status: "pending",
  });

  await sendEmail({
    to: userDetails.email,
    subject: cardRequestEmailTemplate.subject,
    html: cardRequestEmailTemplate.html,
  });

  return sendResponse(
    reply,
    201,
    true,
    "Your Card request was submitted successfully.",
    cardRequest
  );
};

//Get user card request
export const getUserCardRequestHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const decodedDetails = request.user;
  const user = decodedDetails._id;

  const cardRequest = await getUserCardRequest(user);
  return sendResponse(reply, 200, true, "Card request fetched", cardRequest);
};

//Admin Endpoint

//Get card requests
export const getCardRequestsHandler = async (
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

  const result = await getCardRequests(parseInt(page), parseInt(limit));
  return sendResponse(reply, 200, true, "Card requests fetched", result);
};

//Update card request
export const updateCardRequestHandler = async (
  request: FastifyRequest<{ Body: UpdateCardRequestInput }>,
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

  const { requestId, status } = request.body;
  const updated = await updateCardRequest(requestId, status);
  if (!updated)
    return sendResponse(reply, 404, false, "User's card request not found.");

  const userDetails = await findUserById(updated.user.toString());
  if (!userDetails)
    return sendResponse(
      reply,
      400,
      false,
      "Something went wrong, please try again later."
    );

  const cardRequestEmailTemplate = cardRequestEmail({
    name: userDetails.fullName,
    date: new Date().toLocaleString(),
    status: request.body.status,
  });

  await sendEmail({
    to: userDetails.email,
    subject: cardRequestEmailTemplate.subject,
    html: cardRequestEmailTemplate.html,
  });

  //Add it to activities
  const data = {
    admin: admin._id as unknown as string,
    action: "Card Request Update",
    target: userDetails._id.toString(),
    metadata: {
      "User Name": userDetails.fullName,
      "User Email": userDetails.email,
      "Card Request Status": updated.status,
    },
  };
  await newActivity(data);

  return sendResponse(reply, 200, true, "Card request updated", updated);
};

//Delete Card Request
export const deleteCardRequestHandler = async (
  request: FastifyRequest<{ Params: DeleteCardRequestInput }>,
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

  const deleted = await deleteCardRequest(request.params.requestId);
  if (!deleted)
    return sendResponse(reply, 404, false, "Card request not found");

  //Add it to activities
  const data = {
    admin: admin._id as unknown as string,
    action: "Card Request Deletion",
    target: deleted.user.toString(),
  };
  await newActivity(data);

  return sendResponse(reply, 200, true, "Card request deleted", deleted);
};
