import { JwtPayload } from 'jsonwebtoken';
import { Purchase } from '../purchase/purchase.model';
import { Session } from '../sessionBooking/session.model';
import { PAYMENT_STATUS, PLAN_TYPE } from '../purchase/purchase.interface';
import { SESSION_STATUS } from '../sessionBooking/session.interface';
import {
  EarningResponse,
  MonthlyEarningData,
  MonthlySessionData,
  SessionRateResponse,
} from './dashboard.interface';

const getSessionRateData = async (
  user: JwtPayload,
  year: number
): Promise<SessionRateResponse> => {
  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

  // Get all sessions for the mentor in the specified year
  const sessions = await Session.find({
    mentor_id: user.id,
    scheduled_time: { $gte: startDate, $lte: endDate },
    status: { $in: [SESSION_STATUS.COMPLETED, SESSION_STATUS.ACCEPTED] },
  }).lean();

  // Initialize monthly data
  const monthlyData: { [key: string]: MonthlySessionData } = {};
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  months.forEach((month, index) => {
    monthlyData[month] = {
      month,
      payPerSession: 0,
      package: 0,
    };
  });

  // Count sessions by type and month
  let totalPayPerSession = 0;
  let totalPackage = 0;

  sessions.forEach(session => {
    const sessionMonth = months[new Date(session.scheduled_time).getMonth()];

    if (session.session_plan_type === PLAN_TYPE.PayPerSession) {
      monthlyData[sessionMonth].payPerSession += 1;
      totalPayPerSession += 1;
    } else if (session.session_plan_type === PLAN_TYPE.Package) {
      monthlyData[sessionMonth].package += 1;
      totalPackage += 1;
    }
  });

  // Convert to array and sort by month
  const data = Object.values(monthlyData);
  const totalSessions = totalPayPerSession + totalPackage;

  return {
    data,
    totalPayPerSession,
    totalPackage,
    totalSessions,
  };
};

const getEarningData = async (
  user: JwtPayload,
  year: number
): Promise<EarningResponse> => {
  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

  // Get all successful purchases for the mentor in the specified year
  const purchases = await Purchase.find({
    mentor_id: user.id,
    status: PAYMENT_STATUS.PAID,
    createdAt: { $gte: startDate, $lte: endDate },
  }).lean();

  // Initialize monthly data
  const monthlyData: { [key: string]: MonthlyEarningData } = {};
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  months.forEach((month, index) => {
    monthlyData[month] = {
      month,
      payPerSession: 0,
      package: 0,
      subscription: 0,
      total: 0,
    };
  });

  // Calculate earnings by type and month
  let totalPayPerSession = 0;
  let totalPackage = 0;
  let totalSubscription = 0;

  purchases.forEach(purchase => {
    const purchaseMonth = months[new Date(purchase.createdAt).getMonth()];
    // Calculate actual earnings (amount minus application fee)
    const earning = purchase.amount - purchase.application_fee;

    if (purchase.plan_type === PLAN_TYPE.PayPerSession) {
      monthlyData[purchaseMonth].payPerSession += earning;
      totalPayPerSession += earning;
    } else if (purchase.plan_type === PLAN_TYPE.Package) {
      monthlyData[purchaseMonth].package += earning;
      totalPackage += earning;
    } else if (purchase.plan_type === PLAN_TYPE.Subscription) {
      monthlyData[purchaseMonth].subscription += earning;
      totalSubscription += earning;
    }
  });

  // Calculate total for each month
  Object.keys(monthlyData).forEach(month => {
    monthlyData[month].total =
      monthlyData[month].payPerSession +
      monthlyData[month].package +
      monthlyData[month].subscription;
  });

  // Convert to array and sort by month
  const data = Object.values(monthlyData);
  const totalEarnings = totalPayPerSession + totalPackage + totalSubscription;

  return {
    data,
    totalPayPerSession,
    totalPackage,
    totalSubscription,
    totalEarnings,
  };
};

const getMentorGeneralStats = async (user: JwtPayload) => {
  // Get current date information for comparison
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calculate previous month (handling January case)
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Current month date range
  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const currentMonthEnd = new Date(
    currentYear,
    currentMonth + 1,
    0,
    23,
    59,
    59,
    999
  );

  // Previous month date range
  const prevMonthStart = new Date(prevMonthYear, prevMonth, 1);
  const prevMonthEnd = new Date(
    prevMonthYear,
    prevMonth + 1,
    0,
    23,
    59,
    59,
    999
  );

  // Get current month stats
  const [
    totalSession,
    totalMentee,
    totalEarning,
    prevMonthSessions,
    prevMonthMentees,
    prevMonthEarnings,
  ] = await Promise.all([
    // Current month stats
    Session.countDocuments({
      mentor_id: user.id,
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
    }),
    Purchase.countDocuments({
      mentor_id: user.id,
      createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
    }).distinct('mentee_id'),
    Purchase.aggregate([
      {
        $match: {
          mentor_id: user.id,
          status: 'completed',
          createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalEarning: {
            $sum: '$amount',
          },
        },
      },
    ]),

    // Previous month stats
    Session.countDocuments({
      mentor_id: user.id,
      createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
    }),
    Purchase.countDocuments({
      mentor_id: user.id,
      createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
    }).distinct('mentee_id'),
    Purchase.aggregate([
      {
        $match: {
          mentor_id: user.id,
          status: 'completed',
          createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalEarning: {
            $sum: '$amount',
          },
        },
      },
    ]),
  ]);

  // Calculate growth rates
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const currentMonthEarning = totalEarning[0]?.totalEarning * 0.1 || 0;
  const prevMonthEarning = prevMonthEarnings[0]?.totalEarning * 0.1 || 0;

  // Get all-time totals
  const [allTimeSessions, allTimeMentees, allTimeEarnings] = await Promise.all([
    Session.countDocuments({ mentor_id: user.id }),
    Purchase.countDocuments({ mentor_id: user.id }).distinct('mentee_id'),
    Purchase.aggregate([
      {
        $match: {
          mentor_id: user.id,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalEarning: {
            $sum: '$amount',
          },
        },
      },
    ]),
  ]);

  return {
    totalSession: {
      value: allTimeSessions,
      growthRate: calculateGrowthRate(totalSession, prevMonthSessions),
    },
    totalMentee: {
      value: allTimeMentees.length || 0,
      growthRate: calculateGrowthRate(
        totalMentee.length || 0,
        prevMonthMentees.length || 0
      ),
    },
    totalEarning: {
      value: allTimeEarnings[0]?.totalEarning * 0.1 || 0,
      growthRate: calculateGrowthRate(currentMonthEarning, prevMonthEarning),
    },
    currentMonthStats: {
      sessions: totalSession,
      mentees: totalMentee.length || 0,
      earning: currentMonthEarning,
    },
  };
};

export const DashboardService = {
  getSessionRateData,
  getEarningData,
  getMentorGeneralStats,
};
