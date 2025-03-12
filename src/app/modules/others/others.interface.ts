import { Model, Types } from "mongoose"

export type IOthers = {
    _id:Types.ObjectId,
    content:string,
    type:"termsAndCondition" | "privacyPolicy",
    createdAt:Date,
    updatedAt:Date
}

export type OthersModel = Model<IOthers>;