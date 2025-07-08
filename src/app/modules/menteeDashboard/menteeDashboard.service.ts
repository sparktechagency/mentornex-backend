import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Session } from '../sessionBooking/session.model';
import { User } from '../user/user.model';
import { Content } from '../content/content.model';
import { JwtPayload } from 'jsonwebtoken';
import { Purchase } from '../purchase/purchase.model';
import { PLAN_TYPE } from '../purchase/purchase.interface';

const getActiveMentorCountService = async (): Promise<number> => {
  const result = await User.aggregate([
    {
      $match: {
        role: 'MENTOR',
        status: 'active',
      },
    },
    {
      $count: 'totalActiveMentors',
    },
  ]);

  return result[0]?.totalActiveMentors || 0;
};

const getTotalSessionCompleted = async (mentee_id: string): Promise<number> => {
  const result = await Session.aggregate([
    {
      $match: {
        mentee_id: mentee_id,
        status: 'completed',
      },
    },
    {
      $count: 'totalSessionCompleted',
    },
  ]);

  return result[0]?.totalSessionCompleted || 0;
};

const getActiveMentorsList = async () => {
  const activeMentorsList = await User.find({
    role: 'MENTOR',
    status: 'active',
  });

  if (!activeMentorsList || activeMentorsList.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No active mentors found');
  }

  return activeMentorsList;
};

const getPremiumContents = async (mentorId: string) => {
  const contents = await Content.find({
    mentor_id: mentorId,
  }).lean();

  return contents;
};

const getAvailableContent = async (mentor_id: string) => {
  const availableContent = await User.find({
    role: 'MENTOR',
    status: 'active',
  });

  if (!availableContent || availableContent.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No available content found');
  }

  return availableContent;
};

const getMenteesMentorList = async (user: JwtPayload) => {
  const purchases = await Purchase.find({
    mentee_id: user.id,
  })
    .populate<{ mentor_id: { _id: string; name: string } }>(
      'mentor_id',
      '_id name'
    )
    .lean();

  const uniqueMentorsMap = new Map();

  purchases.forEach(purchase => {
    if (purchase.mentor_id && purchase.mentor_id._id) {
      uniqueMentorsMap.set(purchase.mentor_id._id.toString(), {
        _id: purchase.mentor_id._id,
        name: purchase.mentor_id.name,
      });
    }
  });

  const uniqueMentors = Array.from(uniqueMentorsMap.values());

  return uniqueMentors;
};

const getGeneralMenteeStat = async (user: JwtPayload) => {
  const [totalActiveMentors, totalSubscription, totalCompletedSession] =
    await Promise.all([
      Purchase.countDocuments({
        mentee_id: user.id,
      }).distinct('mentor_id'),
      Purchase.countDocuments({
        mentee_id: user.id,
        plan_type: PLAN_TYPE.Subscription,
        is_active: true,
      }),
      Session.countDocuments({
        mentee_id: user.id,
        status: 'completed',
      }),
    ]);

  const activeMentors = totalActiveMentors.length;
  return {
    activeMentors,
    totalSubscription,
    totalCompletedSession,
  };
};

export const MenteeDashboardService = {
  getActiveMentorCountService,
  getTotalSessionCompleted,
  getActiveMentorsList,
  getPremiumContents,
  getAvailableContent,
  getMenteesMentorList,
  getGeneralMenteeStat,
};
