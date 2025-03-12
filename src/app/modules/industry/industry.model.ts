import { Schema, model } from 'mongoose';
import { IIndustry, IndustryModel } from './industry.interface'; 

const industrySchema = new Schema<IIndustry, IndustryModel>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'delete'],
    default: 'active'
  },
}, { timestamps: true });

export const Industry = model<IIndustry, IndustryModel>('Industry', industrySchema);
