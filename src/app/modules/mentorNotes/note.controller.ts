import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NoteService } from './note.service';
import { getSingleFilePath } from '../../../shared/getFilePath';
import pick from '../../../shared/pick';
import { Types } from 'mongoose';
import { paginationConstants } from '../../../types/pagination';

const addNote = catchAsync(async (req: Request, res: Response) => {
  const mentor_id = req.user.id;

  const payload = req.body;
  payload.mentor_id = mentor_id;

  if (req.files && req.file && req.file.fieldname === 'doc') {
    payload.file = getSingleFilePath(req.files, 'doc');
  }

  const result = await NoteService.addNoteToDB(payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Note added successfully',
    data: result,
  });
});

const getAllNotes = catchAsync(async (req: Request, res: Response) => {
  const mentor_id = req.user.id;
  const mentee_id = req.query.menteeId as string | undefined;
  const pagination = pick(req.query, paginationConstants);

  const result = await NoteService.getAllNotesFromDB(
    mentor_id,
    pagination,
    mentee_id ? new Types.ObjectId(mentee_id) : undefined
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notes retrieved successfully',
    data: result,
  });
});

const getSingleNote = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoteService.getSingleNote(req.user, id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Note retrieved successfully',
    data: result,
  });
});

const deleteNote = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoteService.deleteNote(req.user, id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Note deleted successfully',
    data: result,
  });
});

const updateNote = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  if (req.files && req.file && req.file.fieldname === 'doc') {
    payload.file = getSingleFilePath(req.files, 'doc');
  }
  payload.mentor_id = req.user.id;
  const result = await NoteService.updateNote(req.user, id, payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Note updated successfully',
    data: result,
  });
});

const getNotesForBothMentorOrMentee = catchAsync(
  async (req: Request, res: Response) => {
    const mentor_id = req.query.mentorId as string | undefined;
    const mentee_id = req.query.menteeId as string | undefined;
    const user = req.user;
    console.log(mentee_id, mentor_id, user);
    const result = await NoteService.getNotesForBothMentorOrMentee(
      user,
      mentor_id,
      mentee_id
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Notes retrieved successfully',
      data: result,
    });
  }
);

export const NoteController = {
  addNote,
  getAllNotes,
  getSingleNote,
  deleteNote,
  updateNote,
  getNotesForBothMentorOrMentee,
};
