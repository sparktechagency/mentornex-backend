import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { NoteController } from './note.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { NoteValidation } from './note.validation';
const router = express.Router();

router.post(
  '/add-note',
  auth(USER_ROLES.MENTOR),
  fileUploadHandler(),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = NoteValidation.createNoteZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    return NoteController.addNote(req, res, next);
  }
);

router.patch(
  '/update-note/:id',
  auth(USER_ROLES.MENTOR),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = NoteValidation.updateNoteZodSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    return NoteController.updateNote(req, res, next);
  }
);
router.get(
  '/both',
  auth(USER_ROLES.MENTOR, USER_ROLES.MENTEE),
  NoteController.getNotesForBothMentorOrMentee
);
router.get(
  '/:id',
  auth(USER_ROLES.MENTOR, USER_ROLES.MENTEE),
  NoteController.getSingleNote
);

router.delete('/:id', auth(USER_ROLES.MENTOR), NoteController.deleteNote);

router.get(
  '/',
  auth(USER_ROLES.MENTOR, USER_ROLES.MENTEE),
  NoteController.getAllNotes
);

export const NoteRoutes = router;
