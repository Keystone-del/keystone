import { FastifyReply, FastifyRequest } from "fastify";

//Services
import {
  createBeneficiary,
  deleteBeneficiary,
  getUserBeneficiaries,
  ownBeneficiary,
} from "./beneficiary.services";

//Schemas
import {
  CreateBeneficiaryInput,
  DeleteBeneficiaryInput,
} from "./beneficiary.schema";

//Utils
import { sendResponse } from "../../utils/response.utils";

//Create New Beneficiary
export const createBeneficiaryHandler = async (
  request: FastifyRequest<{ Body: CreateBeneficiaryInput }>,
  reply: FastifyReply
) => {
  const userId = request.user._id;

  //Check if Beneficiary already exist
  const exists = await ownBeneficiary(request.body.accountNumber, userId);
  if (exists)
    return sendResponse(
      reply,
      409,
      false,
      "You have added the account to your beneficiary list"
    );

  //Create Beneficiary
  const newBeneficiary = await createBeneficiary(request.body, userId);
  if (!newBeneficiary)
    return sendResponse(
      reply,
      400,
      false,
      `Failed to add ${request.body.fullName} as a beneficiary. Please try again.`
    );

  //Return response
  return sendResponse(
    reply,
    201,
    true,
    `${request.body.fullName} was added to your beneficiary list.`
  );
};

//Get Beneficiaries Handler
export const getBeneficiariesHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = request.user._id;
  const beneficiaries = await getUserBeneficiaries(userId);

  return sendResponse(reply, 200, true, "User beneficiaries", beneficiaries);
};

//Delete Beneficiary
export const deleteBeneficiaryHandler = async (
  request: FastifyRequest<{ Params: DeleteBeneficiaryInput }>,
  reply: FastifyReply
) => {
  const userId = request.user._id;
  const id = request.params.id;

  const deleted = await deleteBeneficiary(id, userId);
  if (!deleted) {
    return sendResponse(reply, 404, false, "Beneficiary not found");
  }

  return sendResponse(reply, 200, true, "Beneficiary removed successfully");
};
