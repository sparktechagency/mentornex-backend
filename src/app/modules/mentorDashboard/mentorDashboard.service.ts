import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { Session } from "../sessionBooking/session.model";
import { User } from "../user/user.model";
import stripe from "../../../config/stripe";
import { Subscription } from "../subscription/subscription.model";
import { IPaginationOptions } from "../../../types/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";

const getActiveMenteeService = async (
  mentor_id: string,
  paginationOptions: IPaginationOptions = {}
): Promise<{
  count: number;
  mentees: any[];
  totalMentees: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  try {
    // Calculate pagination parameters
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);

    // Step 1: Find all subscriptions for this mentor
    const subscriptions = await Subscription.find({
      mentor_id: mentor_id,
      status: 'active' // Only consider active subscriptions
    });
    
    // Step 2: Extract all mentee IDs from these subscriptions
    const menteeIds = subscriptions.map(sub => sub.mentee_id);
    
    // Step 3: Find total active mentees count
    const total = await User.countDocuments({
      _id: { $in: menteeIds },
      role: 'MENTEE',
      status: 'active'
    });
    
    // Step 4: Find active mentees with pagination
    const activeMentees = await User.find({
      _id: { $in: menteeIds },
      role: 'MENTEE',
      status: 'active'
    })
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    // Step 5: Return the count, list, and pagination metadata
    return {
      count: total,
      mentees: activeMentees,
      totalMentees: activeMentees.length,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching active mentees: ${error.message}`);
    } else {
      throw new Error('Error fetching active mentees: Unknown error');
    }
  }
};

  const getTotalSessionCompleted = async (mentor_id: string): Promise<number> => {
    const result = await Session.aggregate([
      {
        $match: {
          mentor_id: mentor_id,
          status: 'completed',
        },
      },
      {
        $count: 'totalSessionCompleted',
      },
    ]);
  
    return result[0]?.totalSessionCompleted || 0;
  };

  const getMentorBalance = async (mentorId: string): Promise<any> => {
    try {
      // Find the mentor and get their Stripe account ID
      const mentor = await User.findById(mentorId);
      
      if (!mentor) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Mentor not found');
      }
      
      if (!mentor.stripe_account_id) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Mentor does not have a connected Stripe account');
      }
      
      // Retrieve the balance from Stripe for the connected account
      const balance = await stripe.balance.retrieve({
        stripeAccount: mentor.stripe_account_id,
      });
      
      // Format the balance information
      const availableBalance = balance.available.reduce(
        (sum, fund) => sum + fund.amount,
        0
      ) / 100; // Convert cents to dollars
      
      const pendingBalance = balance.pending.reduce(
        (sum, fund) => sum + fund.amount,
        0
      ) / 100; // Convert cents to dollars
      
      return {
        mentorId,
        stripeAccountId: mentor.stripe_account_id,
        availableBalance,
        pendingBalance,
        currency: balance.available[0]?.currency || 'usd',
        balanceDetails: balance
      };
    } catch (error) {
      console.error('Error retrieving mentor balance:', error);
      throw error;
    }
  };
  const getCompletedPayPerSessionsByMonth = async (mentor_id: string) => {
    try {
      const results = await Session.aggregate([
        {
          $match: {
            mentor_id: mentor_id,
            status: 'pending',
          },
        },
        {
          $project: {
            month: { $dateToString: { format: "%B", date: { $toDate: "$scheduled_time" } } },
          },
        },
        {
          $group: {
            _id: "$month",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
      
      return results.map(item => ({ month: item._id, count: item.count }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error fetching completed sessions by month: ${error.message}`);
      } else {
        throw new Error('Error fetching completed sessions by month: Unknown error');
      }
    }
  };  

export const MentorDashboardService = {
    getActiveMenteeService,
    getTotalSessionCompleted,
    getMentorBalance,
    getCompletedPayPerSessionsByMonth
}