import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export type ISocial = {
  platform: string;
  username: string;
}

export type IZoomToken = {
  access_token: string;
  refresh_token: string;
  expires_at: Date;
}

export type IUser = {
  name: string;
  role: USER_ROLES;
  stripeCustomerId: string;
  email: string;
  industry: string;
  timeZone: string;
  password: string;
  phone: string;
  about: string;
  expertise: string[];
  focus_area: string;
  language: string[];
  job_title: string;
  company_name: string;
  education: string;
  institution_name: string;
  country: string;
  social: ISocial[];
  image?: string;
  status: 'active' | 'inactive' |'delete';
  stripe_account_id?: string;
  verified: boolean;
  zoom_tokens?: IZoomToken;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
  refreshToken: string;
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
