import { model, Schema } from "mongoose";
import { INote, NoteModal } from "./note.interface";


const NoteSchema = new Schema<INote, NoteModal>(
    {
        mentor_id: {
            type: String,
            ref: 'User',
        },
        mentee_id: {
            type: String,
            ref: 'User',
            required: true
          },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        file: {
            type: String
        }
        
    },
    { timestamps: true }
  );

export const Note = model<INote, NoteModal>('Note', NoteSchema);