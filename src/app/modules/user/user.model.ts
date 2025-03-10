import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { ISocial, IUser, IZoomToken, UserModal } from './user.interface';


const zoomTokenSchema = new Schema<IZoomToken>({
  access_token: {
    type: String,
  },
  refresh_token: {
    type: String,
  },
  expires_at: {
    type: Date,
  },
});

const userSchema = new Schema<IUser, UserModal>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    stripeCustomerId: { type: String, required: false },
    industry: {
      type: String,
      required: true,
    },
    timeZone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
      minlength: 8,
    },
    phone: {
      type: String,
    },
    bio: {
      type: String,
    },
    about: {
      type: String,
    },
    expertise: {
      type: [String],
    },
    focus_area: {
      type: String,
    },
    language: {
      type: [String],
    },
    job_title: {
      type: String,
    },
    company_name: {
      type: String,
    },
    education: {
      type: String,
    },
    institution_name: {
      type: String,
    },
    country: {
      type: String,
    },
    facebook_url: {
      type: String,
    },
    twitter_url: {
      type:String
    },
    linkedin_url: {
      type: String,
    },
    instagram_url: {
      type: String,
    },
    website_url: {
      type: String,
    },
    image: {
      type: String,
      default: 'https://i.ibb.co/z5YHLV9/profile.png',
    },
    banner: {
      type: String
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'delete'],
      default: 'inactive',
    },
    stripe_account_id: {
      type: String,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    zoom_tokens: {
      type: zoomTokenSchema,
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: Number,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
      },
      select: 0,
    },
  },

  { timestamps: true }
);

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check user
userSchema.pre('save', async function (next) {
  //check user
  const isExist = await User.findOne({ email: this.email });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already exist!');
  }

  //password hash
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

export const User = model<IUser, UserModal>('User', userSchema);
