import mongoose from "mongoose";

export const validateMongodbId = (
  id:
    | string
    | number
    | mongoose.mongo.BSON.ObjectId
    | mongoose.mongo.BSON.ObjectIdLike
    | Uint8Array<ArrayBufferLike>
) => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) throw new Error("Invalid ID!");
};
