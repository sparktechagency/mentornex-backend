import { Model, Types } from 'mongoose';

export type IIndustry = {
  _id:Types.ObjectId;
  image:string;
  name: string;
  description: string;
  createdAt:Date;
  updatedAt:Date;
  status: 'active' | 'inactive' | 'delete';
};

export type IndustryModel = Model<IIndustry>;
