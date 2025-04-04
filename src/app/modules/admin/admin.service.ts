import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { IUser, IUserFilterableFields } from '../user/user.interface';
import { User } from '../user/user.model';
import { PaymentRecord } from '../payment-record/payment-record.model';
import { monthNames } from './admin.utils';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { USER_SEARCHABLE_FIELDS } from '../user/user.constants';
import { Session } from '../sessionBooking/session.model';
import { SESSION_STATUS } from '../sessionBooking/session.interface';

const createAdminToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  //set role
  payload.role = USER_ROLES.ADMIN;
  const createAdmin = await User.create(payload);
  if (!createAdmin) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create admin');
  }

  //send email
  const otp = generateOTP();
  const values = {
    name: createAdmin.name,
    otp: otp,
    email: createAdmin.email!,
  };
  const createAccountTemplate = emailTemplate.createAccount(values);
  emailHelper.sendEmail(createAccountTemplate);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: createAdmin._id },
    { $set: { authentication } }
  );

  return createAdmin;
};

const getAllAdminFromDB = async (): Promise<Partial<IUser>[]> => {
  const result = await User.find({ role: USER_ROLES.ADMIN });
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No admin found!');
  }
  return result;
};

const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const updateAdminBySuperAdminToDB = async (
  adminId: string,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const isExistUser = await User.isExistUserById(adminId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  const updateDoc = await User.findOneAndUpdate({ _id: adminId }, payload, {
    new: true,
  });
  return updateDoc;
};

const deleteAdminBySuperAdminToDB = async (
  adminId: string
): Promise<Partial<IUser | null>> => {
  const isExistUser = await User.isExistUserById(adminId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  const deleteDoc = await User.findOneAndDelete({ _id: adminId });
  return deleteDoc;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload.image) {
    unlinkFile(isExistUser.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

// ADMIN DASHBOARD API'S

const getMentorAndMenteeCountStats = async (year?: number) => {
  const currentYear = new Date().getFullYear();
  const startDate = new Date(year || currentYear, 0, 1);
  const endDate = new Date(year || currentYear, 11, 31, 23, 59, 59, 999);

  const result = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        role: { $in: [USER_ROLES.MENTOR, USER_ROLES.MENTEE] },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          role: '$role',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.month',
        mentor: {
          $sum: {
            $cond: [{ $eq: ['$_id.role', USER_ROLES.MENTOR] }, '$count', 0],
          },
        },
        mentee: {
          $sum: {
            $cond: [{ $eq: ['$_id.role', USER_ROLES.MENTEE] }, '$count', 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        mentor: 1,
        mentee: 1,
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  //format result
  const formattedResult = Array.from({ length: 12 }, (_, i) => ({
    monthName: monthNames[i],
    mentor: result.find((r: any) => r.month === i + 1)?.mentor || 0,
    mentee: result.find((r: any) => r.month === i + 1)?.mentee || 0,
  }));

  return formattedResult;
};

const getEarningStats = async (year?: number) => {
  const currentYear = new Date().getFullYear();
  const startDate = new Date(year || currentYear, 0, 1);
  const endDate = new Date(year || currentYear, 11, 31, 23, 59, 59, 999);

  const result = await PaymentRecord.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
        },
        totalEarning: { $sum: '$application_fee' },
      },
    },
  ]);

  //format result
  const formattedResult = Array.from({ length: 12 }, (_, i) => ({
    monthName: monthNames[i],
    totalEarning:
      result.find((r: any) => r._id.month === i + 1)?.totalEarning || 0,
  }));

  return formattedResult;
};

const getDashboardStats = async (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  // Previous year dates for comparison
  const previousYear = currentYear - 1;
  const previousYearStart = new Date(previousYear, 0, 1);
  const previousYearEnd = new Date(previousYear, 11, 31, 23, 59, 59, 999);

  // Get current year counts
  const [totalMentor, totalMentee, totalSessions, totalEarnings] =
    await Promise.all([
      User.countDocuments({
        role: USER_ROLES.MENTOR,
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      User.countDocuments({
        role: USER_ROLES.MENTEE,
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      PaymentRecord.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      PaymentRecord.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$application_fee' },
          },
        },
      ]),
    ]);

  // Get previous year data for comparison
  const [
    previousYearMentor,
    previousYearMentee,
    previousYearSessions,
    previousYearEarnings,
  ] = await Promise.all([
    User.countDocuments({
      role: USER_ROLES.MENTOR,
      createdAt: { $gte: previousYearStart, $lte: previousYearEnd },
    }),
    User.countDocuments({
      role: USER_ROLES.MENTEE,
      createdAt: { $gte: previousYearStart, $lte: previousYearEnd },
    }),
    PaymentRecord.countDocuments({
      createdAt: { $gte: previousYearStart, $lte: previousYearEnd },
    }),
    PaymentRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: previousYearStart, $lte: previousYearEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$application_fee' },
        },
      },
    ]),
  ]);

  // Calculate growth rates
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  return {
    totalStats: {
      mentors: totalMentor,
      mentees: totalMentee,
      sessions: totalSessions,
      earnings: totalEarnings[0]?.total || 0,
    },
    growthRates: {
      mentorGrowth: calculateGrowthRate(totalMentor, previousYearMentor),
      menteeGrowth: calculateGrowthRate(totalMentee, previousYearMentee),
      sessionGrowth: calculateGrowthRate(totalSessions, previousYearSessions),
      earningGrowth: calculateGrowthRate(
        totalEarnings[0]?.total || 0,
        previousYearEarnings[0]?.total || 0
      ),
    },
  };
};

const getUserStats = async (role?: USER_ROLES, year?: number) => {
  const currentYear = year || new Date().getFullYear();
  const currentDate = new Date();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
  console.log(startDate, endDate);
  // Last month dates for comparison
  const lastMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1
  );
  const lastMonthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    0,
    23,
    59,
    59,
    999
  );

  // Current month dates
  const currentMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const currentMonthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // Base query for role
  const roleQuery = role
    ? { role }
    : { role: { $in: [USER_ROLES.MENTOR, USER_ROLES.MENTEE] } };

  // Get last month stats for comparison
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalSessions,
    lastMonthTotalUsers,
    lastMonthActiveUsers,
    lastMonthInactiveUsers,
    lastMonthSessions,
    currentMonthTotalUsers,
    currentMonthActiveUsers,
    currentMonthInactiveUsers,
    currentMonthSessions,
  ] = await Promise.all([
    User.countDocuments({
      ...roleQuery,
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    User.countDocuments({
      ...roleQuery,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'active',
    }),
    User.countDocuments({
      ...roleQuery,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'inactive',
    }),
    Session.countDocuments({
      status: { $ne: SESSION_STATUS.CANCELLED },
      createdAt: { $gte: startDate, $lte: endDate },
    }),
    User.countDocuments({
      ...roleQuery,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    User.countDocuments({
      ...roleQuery,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      status: 'active',
    }),
    User.countDocuments({
      ...roleQuery,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      status: 'inactive',
    }),
    PaymentRecord.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    }),
    User.countDocuments({
      ...roleQuery,
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
    }),
    User.countDocuments({
      ...roleQuery,
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
      status: 'active',
    }),
    User.countDocuments({
      ...roleQuery,
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
      status: 'inactive',
    }),
    Session.countDocuments({
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
      status: { $ne: SESSION_STATUS.CANCELLED },
    }),
  ]);

  // Calculate growth rates
  const calculateGrowthRate = (current: number, previous: number) => {
    console.log(current, previous);
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  return {
    totalStats: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      sessions: totalSessions,
    },
    growthRates: {
      totalGrowth: calculateGrowthRate(
        currentMonthTotalUsers,
        lastMonthTotalUsers
      ),
      activeGrowth: calculateGrowthRate(
        currentMonthActiveUsers,
        lastMonthActiveUsers
      ),
      inactiveGrowth: calculateGrowthRate(
        currentMonthInactiveUsers,
        lastMonthInactiveUsers
      ),
      sessionGrowth: calculateGrowthRate(
        currentMonthSessions,
        lastMonthSessions
      ),
    },
  };
};

const getMentorOrMentee = async (
  filters: IUserFilterableFields,
  pagination: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination);
  const { searchTerm, ...filtersData } = filters;
  const andConditions = [];

  if (searchTerm) {
    USER_SEARCHABLE_FIELDS.map(field => {
      andConditions.push({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      });
    });
  }
  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const result = await User.find(whereConditions)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

export const AdminService = {
  createAdminToDB,
  getAllAdminFromDB,
  updateAdminBySuperAdminToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  deleteAdminBySuperAdminToDB,
  // ADMIN DASHBOARD API'S
  getMentorAndMenteeCountStats,
  getEarningStats,
  getDashboardStats,
  getMentorOrMentee,
  getUserStats,
};
