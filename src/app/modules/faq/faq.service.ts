import { StatusCodes } from 'http-status-codes';

import mongoose from 'mongoose';
import { Faq } from './faq.model';
import ApiError from '../../../errors/ApiError';
import { IFaq } from './faq.interface';


const createFaqToDB = async (payload: IFaq): Promise<IFaq> => {
  const faq = await Faq.create(payload);
  if (!faq) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to created Faq');
  }

  return faq;
};

const faqsFromDB = async (query: Record<string, unknown>): Promise<any> => {
  const { page, limit } = query;

  const pages = parseInt(page as string) || 1;
  const size = parseInt(limit as string) || 10;
  const skip = (pages - 1) * size;

  // Resolve the query by awaiting
  const faqs = await Faq.find()
    .select("answer question")
    .skip(skip)
    .limit(size);

  const count = await Faq.countDocuments();

  const data = {
    faqs, // This now contains plain JSON objects, not a query object
    meta: {
      page: pages,
      total: count,
    },
  };

  return data;
};


const deleteFaqToDB = async (id: string): Promise<IFaq | undefined> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ID');
  }

  await Faq.findByIdAndDelete(id);
  return;
};

const updateFaqToDB = async (id: string, payload: IFaq): Promise<IFaq> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ID');
  }

  const updatedFaq = await Faq.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
  });
  if (!updatedFaq) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to updated Faq');
  }

  return updatedFaq;
};

export const FaqService = {
  createFaqToDB,
  updateFaqToDB,
  faqsFromDB,
  deleteFaqToDB,
};  