import { CardRequestModel, CardRequestStatus } from "./cardRequest.model";

//Create card request
export const createCardRequest = async (
  user: string,
  cardNumber: string,
  cardExpiryDate: string,
  cardCVV: string
) => {
  return await CardRequestModel.create({
    user,
    cardNumber,
    cardExpiryDate,
    cardCVV,
  });
};

//Get a card request
export const getUserCardRequest = async (user: string) => {
  return await CardRequestModel.findOne({ user });
};

//Check if a user has a card request
export const userHasRequestedCard = async (user: string) => {
  const existing = await CardRequestModel.findOne({ user });
  return !!existing;
};

//Fetch all cards
export const getCardRequests = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await CardRequestModel.countDocuments();
  const requests = await CardRequestModel.find()
    .populate(
      "user",
      "fullName email profilePicture isOnline isVerified isFullyVerified"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    total,
    page,
    limit,
    data: requests,
  };
};

//Update Card Request
export const updateCardRequest = async (
  id: string,
  status: CardRequestStatus
) => {
  return await CardRequestModel.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
};

//Delete Card Request
export const deleteCardRequest = async (id: string) => {
  return await CardRequestModel.findByIdAndDelete(id);
};
