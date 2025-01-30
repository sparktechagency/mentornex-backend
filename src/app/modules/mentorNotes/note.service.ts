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

const getAllNotesFromDB = async (mentorId: string): Promise<INote[]> => {
  const result = await Note.find({ mentor_id: mentorId })
    .populate({
      path: 'mentee_id',
      model: 'User',
      select: 'name email',
    });

  if (!result || result.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No notes found!");
  }

  return result;
};
export const NoteService = {
    addNoteToDB,
    getAllNotesFromDB
};