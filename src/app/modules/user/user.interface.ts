import { Model, Types } from 'mongoose';
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
  _id: Types.ObjectId;
  name: string;
  role: USER_ROLES;
  stripeCustomerId: string;
  email: string;
  industry: Types.ObjectId;
  timeZone: string;
  password: string;
  phone: string;
  bio: string;
  about: string;
  expertise: string[];
  focus_area: string;
  language: string[];
  job_title: string;
  company_name: string;
  education: string;
  institution_name: string;
  country: string;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  website_url?: string;
  image?: string;
  banner?: string;
  status: 'active' | 'inactive' |'delete';
  stripe_account_id?: string;
  verified: boolean;
  zoom_tokens?: IZoomToken;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;




export type IUserFilterableFields = {
  searchTerm?: string;
  focus_area?: string[];
  expertise?: string;
  status?: 'active' | 'inactive' | 'delete';
  language?: string[];
  minPrice?: number;
  maxPrice?: number;
  availability?: string[];
}