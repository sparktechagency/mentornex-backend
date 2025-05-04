import { ICreateAccount, IResetPassword } from '../types/emailTamplate';

const createAccount = (values: ICreateAccount) => {
  const data = {
    to: values.email,
    subject: 'Verify your account',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="F:/MentorNex/mentornex-backend/src/app/modules/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
          <h2 style="color: #ff6f3c; font-size: 24px; margin-bottom: 20px;">Hey! ${values.name}, Your MentorNex Account Credentials</h2>
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
            <div style="background-color: #ff6f3c; width: 80px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};

const resetPassword = (values: IResetPassword) => {
  const data = {
    to: values.email,
    subject: 'Reset your password',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="F:/MentorNex/mentornex-backend/src/app/modules/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
            <div style="background-color: #ff6f3c; width: 80px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
                <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;text-align:left">If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};

const payment = (email: string, name: string, status: string) => {
  const data = {
    to: email,
    subject: status === 'success' ? 'Payment Successful' : 'Payment Failed',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="F:/MentorNex/mentornex-backend/src/app/modules/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <h2 style="color: ${
          status === 'success' ? '#4CAF50' : '#ff6f3c'
        }; font-size: 24px; margin-bottom: 20px;">
          ${status === 'success' ? 'Payment Successful!' : 'Payment Failed!'}
        </h2>
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Dear ${name || 'Valued Customer'},
            </p>
            ${
              status === 'success'
                ? `<p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    Thank you for your payment. Your subscription has been successfully processed and activated.
                   </p>
                   <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    You now have full access to all our premium features. We hope you enjoy your experience with MentorNex!
                   </p>`
                : `<p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    We were unable to process your subscription payment. Please update your payment method to continue accessing our services.
                   </p>
                   <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    If you need assistance, our support team is here to help you resolve any issues.
                   </p>`
            }
            <p style="color: #b9b4b4; font-size: 14px; line-height: 1.5; margin-top: 30px; text-align: center;">
              If you have any questions, please don't hesitate to contact our support team.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-top: 20px;">
              Best regards,<br>The MentorNex Team
            </p>
        </div>
    </div>
</body>`,
  };
  return data;
};

const subscription = (
  email: string,
  name: string,
  status: string,
  endDate?: string
) => {
  const data = {
    to: email,
    subject:
      status === 'ended' ? 'Subscription Ended' : 'Subscription Cancellation',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="F:/MentorNex/mentornex-backend/src/app/modules/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <h2 style="color: #ff6f3c; font-size: 24px; margin-bottom: 20px;">
          ${
            status === 'ended'
              ? 'Your Subscription Has Ended'
              : 'Subscription Cancellation Notice'
          }
        </h2>
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Dear ${name || 'Valued Customer'},
            </p>
            ${
              status === 'ended'
                ? `<p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    Your subscription period has now come to an end. We hope you've enjoyed using MentorNex and found value in our services.
                   </p>
                   <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    If you'd like to continue enjoying our premium features, please visit our platform to renew your subscription.
                   </p>`
                : `<p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    As requested, your subscription has been marked for cancellation.
                   </p>
                   <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    You will continue to have access to all premium features until ${endDate}.
                   </p>
                   <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                    Should you change your mind, you can reactivate your subscription before this date through our platform.
                   </p>`
            }
            <p style="color: #b9b4b4; font-size: 14px; line-height: 1.5; margin-top: 30px; text-align: center;">
              If you have any questions or need assistance, our support team is always here to help.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-top: 20px;">
              Best regards,<br>The MentorNex Team
            </p>
        </div>
    </div>
</body>`,
  };
  return data;
};

const paymentConfirmation = (
  email: string,
  userName: string,
  planType: string,
  amount: number,
  mentorName: string,
  invoiceId: string
) => {
  const data = {
    to: email,
    subject: `Payment Confirmation - ${planType}`,
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="F:/MentorNex/mentornex-backend/src/app/modules/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <h2 style="color: #4CAF50; font-size: 24px; margin-bottom: 20px;">Payment Confirmation</h2>
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Dear ${userName},
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Thank you for your payment of $${amount.toFixed(
                2
              )} for the ${planType} with ${mentorName}.
            </p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #555; font-size: 16px; margin: 0;">Invoice ID: ${invoiceId}</p>
            </div>
            <p style="color: #b9b4b4; font-size: 14px; line-height: 1.5; margin-top: 30px; text-align: center;">
              If you have any questions, please don't hesitate to contact our support team.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-top: 20px;">
              Best regards,<br>The MentorNex Team
            </p>
        </div>
    </div>
</body>`,
  };
  return data;
};

export const emailTemplate = {
  createAccount,
  resetPassword,
  payment,
  subscription,
  paymentConfirmation,
};
