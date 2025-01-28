import { model, Schema } from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
  {
    sessionId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    stripeSessionId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);