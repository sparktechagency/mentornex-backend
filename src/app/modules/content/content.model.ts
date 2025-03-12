import { Schema, model } from 'mongoose';
import { IContent, ContentModel } from './content.interface'; 

const contentSchema = new Schema<IContent, ContentModel>({
  title: {
    type: String,
    required: true
  },
  mentor: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  description: {
    type: String,
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['intro', 'tutorial'],
    required: true
  },
}, { timestamps: true });

export const Content = model<IContent, ContentModel>('Content', contentSchema);
