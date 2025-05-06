import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IReview } from './review.interface';
import { ReviewMentor } from './review.model';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { PaymentRecord } from '../payment-record/payment-record.model';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { Content } from '../content/content.model';
import { PAYMENT_STATUS } from '../purchase/purchase.interface';
import { Purchase } from '../purchase/purchase.model';
import { USER_ROLES } from '../../../enums/user';

const addReviewToDB = async (payload: IReview): Promise<IReview> => {
  const addReview = await ReviewMentor.create(payload);
  if (!addReview) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to add review');
  }
  return addReview;
};

const getMyReviews = async (user: JwtPayload) => {
  const query =
    user.role === USER_ROLES.MENTEE
      ? { mentee_id: user.id }
      : { mentor_id: user.id };

  const allReviews = await ReviewMentor.find(query)
    .populate('mentor_id', 'name image')
    .populate('mentee_id', 'name image')
    .lean();

  if (!allReviews) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mentors reviews not found');
  }

  return allReviews;
};

const deleteReviewByMenteeFromDB = async (
  mentee_id: string,
  mentor_id: string
) => {
  const review = await ReviewMentor.findOneAndDelete({ mentee_id, mentor_id });
  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
  }
  return review;
};

const getAllMentorForMentee = async (
  user: JwtPayload,
  filterOptions: { searchTerm?: string },
  paginationOptions: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);
  const { searchTerm } = filterOptions;
  const anyCondition = [];
  if (searchTerm) {
    anyCondition.push({
      mentee_id: { mentee_id: { name: { $regex: searchTerm, $options: 'i' } } },
    });
  }
  const whereCondition = { mentee_id: user.id, ...anyCondition };
  const mentors = await PaymentRecord.find(whereCondition)
    .populate<{
      mentor_id: { _id: Types.ObjectId; name: string; image: string };
    }>({ path: 'mentor_id', select: { _id: 1, name: 1, image: 1 } })
    .lean();
  const returnable = mentors.map(mentor => {
    return {
      mentor_id: mentor.mentor_id._id,
      name: mentor.mentor_id.name,
      image: mentor.mentor_id.image,
    };
  });
  const total = await PaymentRecord.countDocuments(whereCondition);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: returnable,
  };
};

const getAvailableContent = async (user: JwtPayload, mentorId: string) => {
  //find the mentor contents

  //see if the requested mentee has any subscription or package purchased with the mentor
  const [menteePackage, menteeSubscription] = await Promise.all([
    Purchase.findOne({
      mentee_id: user.id,
      mentor_id: mentorId,
      status: PAYMENT_STATUS.PAID,
      is_active: true,
    }).lean(),
    Purchase.findOne({
      mentee_id: user.id,
      mentor_id: mentorId,
      status: PAYMENT_STATUS.PAID,
      is_active: true,
    }).lean(),
  ]);

  console.log(menteePackage, menteeSubscription);
  if (!menteePackage && !menteeSubscription) {
    return [];
  }

  const contents = await Content.find({ mentor: mentorId });
  return contents;
};

const getMentorReviews = async (mentorId: string) => {
  const reviews = await ReviewMentor.find({ mentor_id: mentorId })
    .populate('mentee_id', '_id name image')
    .lean();
  return reviews;
};

export const ReviewService = {
  addReviewToDB,
  getMyReviews,
  deleteReviewByMenteeFromDB,
  getAllMentorForMentee,
  getAvailableContent,
  getMentorReviews,
};
