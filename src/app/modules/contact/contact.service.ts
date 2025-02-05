import { StatusCodes } from "http-status-codes";
import { IContact } from "./contact.interface";
import { Contact } from "./contact.model";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";

const createContactToDB = async (payload: IContact): Promise<IContact | null> => {

    const result = await Contact.create(payload);
    if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to created Contact")
    }

    return result;
}

const getContactFromDB = async (query: Record<string, unknown>): Promise<IContact[]> => {
    const { page, limit } = query;

    const pages = parseInt(page as string) || 1;
    const size = parseInt(limit as string) || 10;
    const skip = (pages - 1) * size;

    const result = await Contact.find().skip(skip).limit(size).lean();
    const total = await Contact.countDocuments();

    const data:any = {
        contacts: result,
        meta: {
            page: pages,
            total
        }
    }
    return data;
}

const deleteContactToDB = async (id: string): Promise<IContact | null> => {
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid ID");
    }

    const result = await Contact.findByIdAndDelete(id);

    if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to deleted Contact")
    }

    return result;
}

const bulkContactDeleteToDB = async (ids: string[]): Promise<{}> => {

    const allValid = ids?.every(id => mongoose.Types.ObjectId.isValid(id));
    if (!allValid) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "One or more IDs are invalid");
    }

    const result = await Contact.deleteMany();

    if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to deleted Contact")
    }

    return result;
}

export const ContactService = {
    createContactToDB,
    getContactFromDB,
    deleteContactToDB,
    bulkContactDeleteToDB
}