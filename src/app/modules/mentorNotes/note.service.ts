import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { INote } from "./note.interface";
import { Note } from "./note.model";


const addNoteToDB = async (payload: INote): Promise<INote> => {
    const addNote = await Note.create(payload);
    if (!addNote) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add Note');
    }
    return addNote;
};

export const NoteService = {
    addNoteToDB
};