import { Model, Types } from 'mongoose';

export type IContent = {
  _id:Types.ObjectId;
  mentor:Types.ObjectId;
  title: string;
  description: string;
  url:string;
  type: "intro" | "tutorial";
  createdAt: Date;
  updatedAt: Date;
};

export type ContentModel = Model<IContent>;
