import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { INote } from './note.interface';
import { Note } from './note.model';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { Types } from 'mongoose';

const addNoteToDB = async (payload: INote): Promise<INote> => {
  const addNote = await Note.create(payload);
  if (!addNote) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add Note');
  }
  return addNote;
};

const getAllNotesFromDB = async (
  mentorId: string,
  paginationOptions: IPaginationOptions,
  menteeId?: Types.ObjectId
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);
  const query = menteeId
    ? { mentor_id: mentorId, mentee_id: menteeId }
    : { mentor_id: mentorId };
  const result = await Note.find(query)
    .populate({
      path: 'mentee_id',
      model: 'User',
      select: 'name email',
    })
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  const total = await Note.countDocuments(query);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getSingleNote = async (
  user: JwtPayload,
  id: string
): Promise<INote | null> => {
  const result = await Note.findById(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Requested note not found!');
  }
  if (user.id !== result?.mentor_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to view this note.'
    );
  }

  return result;
};

const deleteNote = async (
  user: JwtPayload,
  id: string
): Promise<INote | null> => {
  const result = await Note.findById(id);

  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Requested note not found!');
  }
  if (user.id !== result?.mentor_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to delete this note.'
    );
  }
  await Note.findByIdAndDelete(id);
  return result;
};

const updateNote = async (
  user: JwtPayload,
  id: string,
  payload: INote
): Promise<INote | null> => {
  const result = await Note.findById(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Requested note not found!');
  }
  if (user.id !== result?.mentor_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to update this note.'
    );
  }
  await Note.findByIdAndUpdate(id, { $set: payload }, { new: true });
  return result;
};

const getNotesForBothMentorOrMentee = async (
  user: JwtPayload,
  mentorId?: string,
  menteeId?: string
) => {
  // Build query using $and for better MongoDB optimization
  const query: any = {
    $and: [{ $or: [{ mentor_id: user.id }, { mentee_id: user.id }] }],
  };

  // Add optional filters if provided
  if (mentorId) {
    query.$and.push({ mentor_id: mentorId });
  }

  if (menteeId) {
    query.$and.push({ mentee_id: menteeId });
  }

  const result = await Note.find(query)
    .populate({
      path: 'mentee_id',
      select: 'name email',
    })
    .populate({
      path: 'mentor_id',
      select: 'name email',
    });

  return result;
};

export const NoteService = {
  addNoteToDB,
  getAllNotesFromDB,
  getSingleNote,
  deleteNote,
  updateNote,
  getNotesForBothMentorOrMentee,
};
