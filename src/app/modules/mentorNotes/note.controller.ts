import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { NoteService } from "./note.service";
import { getSingleFilePath } from "../../../shared/getFilePath";

const addNote = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentor_id = req.user.id;
      let files = getSingleFilePath(req.files, 'doc');
      if (!files || Object.keys(files).length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const note = {mentor_id, file: files, ...req.body};
      const result = await NoteService.addNoteToDB(note);
  
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Note added successfully',
        data: result,
      });
    }

  );

  const getAllNotes = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const mentor_id = req.user.id;
      const result = await NoteService.getAllNotesFromDB(mentor_id);

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
    getAllNotes
 }