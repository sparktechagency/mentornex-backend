import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Session } from '../sessionBooking/session.model';
import { User } from '../user/user.model';
import { Content } from '../content/content.model';

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

export const MenteeDashboardService = {
  getActiveMentorCountService,
  getTotalSessionCompleted,
  getActiveMentorsList,
  getPremiumContents,
};
