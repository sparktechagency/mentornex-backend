import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IIndustry, IndustryModel } from './industry.interface';
import { Industry } from './industry.model';
import { User } from '../user/user.model';
import { Types } from 'mongoose';

const createIndustry = async (payload: IIndustry) => {
  const industry = await Industry.create(payload);
  return industry;
};

const getAllIndustries = async () => {
    const industries = await Industry.find({ status: 'active' });
  
    // Use Promise.all to handle all asynchronous calls in the map
    const modifiedResult = await Promise.all(
      industries.map(async (industry) => {
        // Await the mentor count query
        const mentorCount = await User.countDocuments({ industry: new Types.ObjectId(industry._id) });
        return { ...industry.toObject(), mentorCount };  // Ensure to convert Mongoose document to plain object
      })
    );
  
    return modifiedResult;
  };
  

const updateIndustry = async (id: string, payload: IIndustry) => {
  const industry = await Industry.findByIdAndUpdate(id, payload, { new: true });
  return industry;
};

const deleteIndustry = async (id: string) => {
  const industry = await Industry.findByIdAndUpdate(id,{$set:{status:'delete'}});
  if(!industry) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete industry')
  return industry;
};

const getSingleIndustry = async (id: string) => {
  const industry = await Industry.findOne({_id:id, status:'active'});
  if(!industry) throw new ApiError(StatusCodes.BAD_REQUEST, 'Required industry not found.')
  return industry;
};

export const IndustryServices = { createIndustry, getAllIndustries, updateIndustry, deleteIndustry, getSingleIndustry };
