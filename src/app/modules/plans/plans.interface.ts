import { Model, Types } from 'mongoose';


export type IPayPerSession = {
  _id:Types.ObjectId;
  mentor_id:Types.ObjectId;
  title:string;
  amount:number;
  duration:string;
  description:string;
  features:string[];
  status:'active' | 'inactive';
  created_at:Date;
  updated_at:Date;
}

export type IPackage ={
  _id:Types.ObjectId;
  mentor_id:Types.ObjectId;
  title:string;
  amount:number;
  sessions:number;
  description:string;
  features:string[];
  status:'active' | 'inactive';
  created_at:Date;
  updated_at:Date;
}

export type ISubscription = {
  _id:Types.ObjectId;
  mentor_id:Types.ObjectId;
  title:string;
  amount:number;
  isContent?:boolean;
  stripe_account_id:string;
  stripe_product_id:string;
  stripe_price_id:string;
  payment_link?:string;
  description:string;
  features:string[];
  sessions?:number;
  status:'active' | 'inactive';
  type:'basic' | 'pro' | 'premium';
  created_at:Date;
  updated_at:Date;
}


export type IPayPerSessionModel = Model<IPayPerSession>;
export type IPackageModel = Model<IPackage>;
export type ISubscriptionModel = Model<ISubscription>;

