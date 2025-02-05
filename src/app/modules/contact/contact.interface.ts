import { Model } from "mongoose";

export type IContact = {
    question: String;
    name: String;
    email: String;
    phone: String; 
    jobTitle: String;
    status: 'active' | 'delete'
}

export type ContactModel = Model<IContact, Record<string, unknown>>;