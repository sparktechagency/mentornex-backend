import { Model } from 'mongoose';


export type INote = {
    mentor_id: string;
    mentee_id: string;
    title: string;
    description: string;
    file: string;
};

export type NoteModal = Model<INote>;