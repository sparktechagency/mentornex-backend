import { JwtPayload } from 'jsonwebtoken';
import { ISession, ISessionFilter, SESSION_STATUS } from './session.interface';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import {
  calculateEndTime,
  convertSessionTimeToLocal,
  convertSessionTimeToUTC,
} from '../../../helpers/date.helper';
import { Session } from './session.model';
import mongoose, { Types } from 'mongoose';
import {
  handleNotificationAndDataSendForSocket,
  isSlotAvailable,
} from './session.utils';
import { IPaginationOptions } from '../../../types/pagination';
import { sessionSearchableFields } from './session.constants';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { Purchase } from '../purchase/purchase.model';
import { Package, PayPerSession } from '../plans/plans.model';
import { IUser } from '../user/user.interface';
import { StripeService } from '../purchase/stripe.service';
import { PLAN_TYPE } from '../purchase/purchase.interface';

const createSessionRequest = async (
  user: JwtPayload,
  payload: ISession & { slot: string; date: string },
  isPayPerSession?: boolean
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const duration = 45;
  try {
    const isUserExist = await User.findById(user.id).lean();
    if (!isUserExist || isUserExist.status !== 'active') {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'You are not authorized to purchase this session.'
      );
    }
    // Convert slot to UTC with proper date reference
    const convertedSlot = convertSessionTimeToUTC(
      payload.slot,
      isUserExist.timeZone,
      payload.date
    );
    const convertedDate = new Date(convertedSlot.isoString);
    const endTime = calculateEndTime(convertedDate, duration);

    //need to check if the slot is available //TODO
    const isRequestedSlotAvailable = await isSlotAvailable(
      payload.mentor_id as Types.ObjectId,
      convertedDate,
      endTime,
      duration
    );
    if (!isRequestedSlotAvailable) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'The requested slot is not available.'
      );
    }

    const mentorId = payload.mentor_id as Types.ObjectId;

    if (payload.package_id) {
      const pkg = await Purchase.findOne({
        mentee_id: isUserExist._id,
        package_id: payload.package_id,
      }).lean();

      if (!pkg)
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Package data not found, please try again.'
        );
      //@ts-ignore
      if (pkg.remainingSession <= 0 || !pkg.is_active)
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Package quota is over. Please purchase a new package.'
        );
      payload.package_id = pkg.package_id!._id;
      payload.payment_required = false;
    }

    const sessionData = {
      mentor_id: payload.mentor_id,
      mentee_id: user.id,
      scheduled_time: convertedDate,
      end_time: endTime,
      topic: payload.topic,
      duration: duration,
      expected_outcome: payload.expected_outcome,
      session_plan_type: payload.session_plan_type,
      status: SESSION_STATUS.PENDING,
      payment_required: payload.payment_required,
      ...(isPayPerSession && {
        pay_per_session_id: payload.pay_per_session_id,
      }),
      ...(payload.package_id && { package_id: payload.package_id }),
      // ...(payload.subscription_id && {
      //   subscription_id: payload.subscription_id,
      // }),
    };

    const bookedSession = await Session.create([sessionData], { session });

    let paymentUrl;
    //if pay per session create checkout
    if (isPayPerSession) {
      const payPerSession = await PayPerSession.findById(
        new Types.ObjectId(payload.pay_per_session_id)
      )
        .populate<{ mentor_id: Partial<IUser> }>({
          path: 'mentor_id',
          select: { stripeCustomerId: 1, stripe_account_id: 1, _id: 1 },
        })
        .lean();

      console.log(payload.pay_per_session_id, payPerSession);
      if (!payPerSession)
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Pay per session data not found, please try again.'
        );
      sessionData.payment_required = true;

      const { _id, stripeCustomerId, stripe_account_id } =
        payPerSession.mentor_id;

      if (!stripeCustomerId || !stripe_account_id)
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Stripe data not found, please try again.'
        );

      const payment = await StripeService.createCheckoutSession(
        stripeCustomerId!,
        user.id,
        payPerSession!.mentor_id?._id!.toString(),
        payPerSession.title,
        PLAN_TYPE.PayPerSession,
        stripe_account_id,
        payPerSession.amount,
        undefined,
        payPerSession._id.toString(),
        bookedSession[0]._id.toString()
      );

      paymentUrl = payment.url;
    }

    if (payload.package_id) {
      await Purchase.findOneAndUpdate(
        { package_id: payload.package_id },
        { $inc: { 'purchased_plan.remainingSession': -1 } },
        { session }
      );
    }

    if (!bookedSession[0])
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create session request.'
      );

    await session.commitTransaction();

    await handleNotificationAndDataSendForSocket(
      user.id.toString(),
      payload.mentor_id.toString(),
      SESSION_STATUS.PENDING,
      bookedSession[0]._id.toString()
    );

    if (paymentUrl) {
      return {
        paymentUrl,
      };
    } else {
      return bookedSession;
    }
  } catch (error) {
    console.error('Error creating session request:', error);
    await session.abortTransaction();

    throw error;
  } finally {
    await session.endSession();
  }
};

const updateBookedSession = async (
  user: JwtPayload,
  sessionId: Types.ObjectId,
  payload: ISession & { slot: string; date: string }
) => {
  const duration = 45;

  // Validate user first
  const isUserExist = await User.findById(user.id).lean();
  if (!isUserExist || isUserExist.status !== 'active') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to access this session.'
    );
  }

  // Fetch session with all required data in a single query
  const session = await Session.findById(sessionId)
    .populate<{
      mentee_id: {
        name: string;
        timeZone: string;
        _id: Types.ObjectId;
        email: string;
      };
    }>('mentee_id', 'name timeZone _id email')
    .populate<{
      purchased_plan: {
        _id: Types.ObjectId;
        totalSession: number;
        remainingSession: number;
      };
    }>('purchased_plan', 'totalSession remainingSession')
    .populate<{
      mentor_id: {
        name: string;
        timeZone: string;
        _id: Types.ObjectId;
        email: string;
      };
    }>('mentor_id', 'name timeZone _id email');

  // Validate session and user authorization
  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found');
  }

  const isMentor = user.id === session.mentor_id._id.toString();
  const isMentee = user.id === session.mentee_id._id.toString();

  if (!isMentor && !isMentee) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not authorized to access this session.'
    );
  }

  // Start transaction for critical operations
  const dbSession = await mongoose.startSession();
  try {
    dbSession.startTransaction();

    // Handle different session status updates
    switch (payload.status) {
      case SESSION_STATUS.ACCEPTED:
        // Only mentor can accept sessions
        if (!isMentor) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            'Only mentor can accept the session.'
          );
        }

        // Only pending sessions can be accepted
        if (session.status !== SESSION_STATUS.PENDING) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Only pending sessions can be accepted.'
          );
        }

        session.status = SESSION_STATUS.ACCEPTED;
        await session.save({ session: dbSession });

        await handleNotificationAndDataSendForSocket(
          user.id,
          session.mentee_id._id.toString(),
          SESSION_STATUS.ACCEPTED,
          session._id.toString(),
          session
        );
        break;

      case SESSION_STATUS.CANCELLED:
        // Validate cancellation permissions
        if (!isMentor && session.status !== SESSION_STATUS.PENDING) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            'Only mentor can cancel non-pending sessions.'
          );
        }

        // Require cancellation reason
        if (!payload.cancel_reason) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Cancellation reason is required.'
          );
        }

        session.status = SESSION_STATUS.CANCELLED;
        session.cancel_reason = payload.cancel_reason;
        await session.save({ session: dbSession });

        if (session.package_id) {
          await Purchase.findOneAndUpdate(
            { package_id: session.package_id },
            { $inc: { 'purchased_plan.remainingSession': 1 } },
            { session: dbSession }
          );
        }

        const receiver = isMentor
          ? session.mentee_id._id.toString()
          : session.mentor_id._id.toString();

        await handleNotificationAndDataSendForSocket(
          user.id,
          receiver,
          SESSION_STATUS.CANCELLED,
          session._id.toString(),
          session
        );
        break;

      case SESSION_STATUS.RESCHEDULED:
        // Validate rescheduling permissions
        if (
          !(
            session.status === SESSION_STATUS.CANCELLED ||
            session.status === SESSION_STATUS.ACCEPTED
          )
        ) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Only cancelled or accepted sessions can be rescheduled.'
          );
        }

      // Fall through to handle rescheduling

      default:
        // Handle rescheduling (either explicit or from ACCEPTED status)
        if (
          payload.status === SESSION_STATUS.RESCHEDULED ||
          session.status === SESSION_STATUS.ACCEPTED
        ) {
          // Validate date and slot are provided
          if (!payload.date || !payload.slot) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Date and slot are required to reschedule the session.'
            );
          }

          // Convert time to UTC
          const convertedSlot = convertSessionTimeToUTC(
            payload.slot,
            isUserExist.timeZone,
            payload.date
          );
          const convertedDate = new Date(convertedSlot.isoString);
          const endTime = calculateEndTime(convertedDate, duration);

          // Check if the new slot is available
          const isAvailableSlot = await isSlotAvailable(
            session.mentor_id._id,
            convertedDate,
            endTime,
            duration // Exclude current session from availability check
          );

          if (!isAvailableSlot) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'The requested slot is not available.'
            );
          }

          // Update session times
          session.status = payload.status || session.status;
          session.scheduled_time = convertedDate;
          session.end_time = endTime;
          await session.save({ session: dbSession });

          // Handle package or pay-per-session updates
          const isPackageSession = !!session.package_id;

          if (!isPackageSession && session.pay_per_session_id) {
            await Purchase.findOneAndUpdate(
              { pay_per_session_id: session.pay_per_session_id },
              { $set: { is_active: false } },
              { session: dbSession }
            );
          } else if (isPackageSession) {
            const { remainingSession } = session.purchased_plan || {
              remainingSession: 0,
            };

            await Purchase.findOneAndUpdate(
              { package_id: session.package_id },
              { $inc: { 'purchased_plan.remainingSession': -1 } },
              { session: dbSession }
            );

            // Deactivate package if no sessions remain
            if (remainingSession <= 1) {
              await Purchase.findOneAndUpdate(
                { package_id: session.package_id },
                { $set: { is_active: false } },
                { session: dbSession }
              );
            }
          }

          // Send notification
          const notificationReceiver = isMentor
            ? session.mentee_id._id.toString()
            : session.mentor_id._id.toString();

          await handleNotificationAndDataSendForSocket(
            user.id,
            notificationReceiver,
            SESSION_STATUS.RESCHEDULED,
            session._id.toString(),
            session
          );
        }
    }

    await dbSession.commitTransaction();
    return session;
  } catch (error) {
    await dbSession.abortTransaction();
    console.error('Error updating session:', error);
    throw error;
  } finally {
    dbSession.endSession();
  }
};

const getSession = async (user: JwtPayload, sessionId: Types.ObjectId) => {
  const isUserExist = await User.findById(user.id).lean();
  if (!isUserExist || isUserExist.status !== 'active') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not authorized to access this session.'
    );
  }

  const session = await Session.findById(sessionId).lean();
  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found');
  }

  const displayTime = convertSessionTimeToLocal(
    session.scheduled_time,
    isUserExist.timeZone
  );
  const displayEndTime = convertSessionTimeToLocal(
    session.end_time,
    isUserExist.timeZone
  );

  return {
    ...session,
    scheduled_time: displayTime,
    end_time: displayEndTime,
  };
};

const getSessionBookingsByUser = async (
  user: JwtPayload,
  paginationOptions: IPaginationOptions,
  filters: ISessionFilter
) => {
  const { searchTerm, ...filterableFields } = filters;
  const anyCondition: any[] = [];

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  if (searchTerm) {
    sessionSearchableFields.map(field => {
      anyCondition.push({ [field]: { $regex: searchTerm, $options: 'i' } });
    });
  }

  if (Object.entries(filterableFields).length > 0) {
    anyCondition.push({
      $and: Object.entries(filterableFields).map(([field, value]) => {
        return {
          [field]: value,
        };
      }),
    });
  }

  anyCondition.push({ $or: [{ mentee_id: user.id }, { mentor_id: user.id }] });
  const whereCondition = anyCondition.length > 0 ? { $and: anyCondition } : {};

  const sessions = await Session.find(whereCondition)
    .populate<{
      mentee_id: { name: string; timeZone: string; _id: Types.ObjectId };
    }>('mentee_id', 'name timeZone _id')
    .populate<{
      mentor_id: { name: string; timeZone: string; _id: Types.ObjectId };
    }>('mentor_id', 'name timeZone _id')
    .lean()
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder });

  if (sessions.length !== 0) {
    const timeZone =
      user.role === 'MENTEE'
        ? sessions[0].mentee_id.timeZone
        : sessions[0].mentor_id.timeZone;
    sessions.forEach(session => {
      //@ts-ignore
      session.scheduled_time = convertSessionTimeToLocal(
        session.scheduled_time,
        timeZone
      );
      //@ts-ignore
      session.end_time = convertSessionTimeToLocal(session.end_time, timeZone);
    });
  }

  //before sending data convert the time to local time

  const total = await Session.countDocuments(whereCondition);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: sessions,
  };
};

export const SessionService = {
  createSessionRequest,
  getSession,
  updateBookedSession,
  getSessionBookingsByUser,
};
