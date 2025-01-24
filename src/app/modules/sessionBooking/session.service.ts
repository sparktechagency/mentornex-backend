import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { ISession } from "./session.interface";
import { Session } from "./session.model";



const bookSessionToDB = async (payload: Partial<ISession>): Promise<ISession> => {
    //set role
    //payload.role = USER_ROLES.USER;
    const bookSession = await Session.create(payload);
    if (!bookSession) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to book session');
    }
     
  
    return bookSession;
  };

const getMenteeUpcomingSessions = async (mentee_id: string) => {
    const sessions = await Session.find({ mentee_id, status: { $in: ['pending', 'accepted', 'rejected'] } })
      .populate({
        path: 'mentee_id',
        select: 'name',
      })
      .exec();
  
    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No upcoming sessions found');
    }
  
    return sessions;
  };

const getMenteeCompletedSessions = async (mentee_id: string) => {
    const sessions = await Session.find({ mentee_id, status: { $in: ['completed', 'rejected'] } })
      .populate({
        path: 'mentee_id',
        select: 'name',
      })
      .exec();
  
    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No completed sessions found');
    }
  
    return sessions;
  };

const getMentorPendingSessions = async (mentor_id: string) => {
    const sessions = await Session.find({ mentor_id, status: 'pending' })
      .populate({
        path: 'mentee_id',
        select: 'name',
      })
      .exec();
  
    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No pending sessions found');
    }
  
    return sessions;
  };
const getMentorAcceptedSessions = async (mentor_id: string) => {
    const sessions = await Session.find({ mentor_id, status: 'accepted' })
      .populate({
        path: 'mentee_id',
        select: 'name',
      })
      .exec();
  
    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No upcoming sessions found');
    }
  
    return sessions;
  };

  const getMentorCompletedSessions = async (mentor_id: string) => {
    const sessions = await Session.find({ mentor_id, status: 'completed' })
      .populate({
        path: 'mentee_id',
        select: 'name',
      })
      .exec();

    if (!sessions || sessions.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No completed sessions found');
    }

    return sessions;
  };

  const updateSessionStatus = async (
    sessionId: string,
    mentor_id: string,
    status: 'accepted' | 'rejected'
  ) => {
    const session = await Session.findOne({ _id: sessionId, mentor_id, status: 'pending' });
  
    if (!session) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found or already updated');
    }
  
    session.status = status;
    await session.save();
  
    return session;
  };
  

export const SessionService = {
    bookSessionToDB,
    getMentorPendingSessions,
    getMentorAcceptedSessions,
    getMentorCompletedSessions,
    getMenteeUpcomingSessions,
    getMenteeCompletedSessions,
    updateSessionStatus
};

