import { Purchase } from '../purchase/purchase.model';
import { PaymentRecord } from './payment-record.model';

const getAllTransactions = async () => {
  const result = await Purchase.find({})
    .populate('mentor_id', 'name email')
    .populate('mentee_id', 'name email')
    .populate('package_id', 'title amount')
    .populate('subscription_id', 'title amount')
    .populate('pay_per_session_id', 'title amount')
    .lean();
  return result;
};

export const PaymentService = {
  getAllTransactions,
};
