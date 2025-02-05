import { model, Schema } from "mongoose";
import { IContact, ContactModel } from "./contact.interface";

const contactSchema = new Schema<IContact, ContactModel>(
    {
        question: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        jobTitle: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'delete'],
            default: "active"
        }
    },
    {
        timestamps: true
    }
)

export const Contact = model<IContact, ContactModel>("Contact", contactSchema)