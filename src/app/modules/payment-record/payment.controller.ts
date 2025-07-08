import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PaymentService } from './payment.service';

const getAllTransactions = catchAsync(async (req, res) => {
  const result = await PaymentService.getAllTransactions();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All transactions retrieved successfully',
    data: result,
  });
});

export const PaymentController = {
  getAllTransactions,
};
