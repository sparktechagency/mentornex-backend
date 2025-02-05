import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { PaymentRecord } from '../payment-record/payment-record.model';

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

const getTotalMentorFromDB = async (): Promise<number> => {
  const result = await User.aggregate([
    {
      $match: {
        role: 'MENTOR',
      },
    },
    {
      $count: 'totalMentors',
    },
  ]);
  return result[0]?.totalMentors || 0;
};

const getTotalActiveMentorFromDB = async (): Promise<number> => {
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

const getTotalInactiveMentorFromDB = async (): Promise<number> => {
  const result = await User.aggregate([
    {
      $match: {
        role: 'MENTOR',
        status: 'inactive',
      },
    },
    {
      $count: 'totalInActiveMentors',
    },
  ]);
  return result[0]?.totalInActiveMentors || 0;
};

const getTotalMenteeFromDB = async (): Promise<number> => {
  const result = await User.aggregate([
    {
      $match: {
        role: 'MENTEE',
      },
    },
    {
      $count: 'totalMentees',
    },
  ]);
  return result[0]?.totalMentees || 0;
};

const getTotalActiveMenteeFromDB = async (): Promise<number> => {
  const result = await User.aggregate([
    {
      $match: {
        role: 'MENTEE',
        status: 'active',
      },
    },
    {
      $count: 'totalActiveMentees',
    },
  ]);
  return result[0]?.totalActiveMentees || 0;
};

const getTotalInactiveMenteeFromDB = async (): Promise<number> => {
  const result = await User.aggregate([
    {
      $match: {
        role: 'MENTEE',
        status: 'inactive',
      },
    },
    {
      $count: 'totalInActiveMentees',
    },
  ]);
  return result[0]?.totalInActiveMentees || 0;
};

const getAllTransactionForMentorFromDB = async (mentor_id: string) => {
  const result = await PaymentRecord.find({
    mentor_id: mentor_id,
    status: 'succeeded'
  })
  .populate('mentee_id', 'name email image')
  .sort({ created_at: -1 })
  .lean();

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No transactions found');
  }

  return result;
};

const getAllTransactionForMenteeFromDB = async (mentee_id: string) => {
  const result = await PaymentRecord.find({
    mentee_id: mentee_id,
    status: 'succeeded'
  })
  .populate('mentor_id', 'name email image')
  .sort({ created_at: -1 })
  .lean();

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No transactions found');
  }

  return result;
};

export const AdminService = {
  createAdminToDB,
  getAllAdminFromDB,
  updateAdminBySuperAdminToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  deleteAdminBySuperAdminToDB,
  getTotalMentorFromDB,
  getTotalActiveMentorFromDB,
  getTotalInactiveMentorFromDB,
  getTotalMenteeFromDB,
  getTotalActiveMenteeFromDB,
  getTotalInactiveMenteeFromDB,
  getAllTransactionForMentorFromDB,
  getAllTransactionForMenteeFromDB
};
