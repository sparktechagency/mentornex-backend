import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { NoteController } from './note.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
const router = express.Router();

router
  .route('/add-note')
  .post(
    auth(USER_ROLES.MENTOR),
    fileUploadHandler(),
    NoteController.addNote
  );

router.route('/all-notes-list').get(auth(USER_ROLES.MENTOR), NoteController.getAllNotes);

export const NoteRoutes = router;