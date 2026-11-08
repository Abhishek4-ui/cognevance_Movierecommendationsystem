import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else {
      // Create Ethereal test account if credentials aren't provided
      nodemailer.createTestAccount().then(testAccount => {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`[Email Service] Initialized Ethereal fallback: ${testAccount.user}`);
      }).catch(err => {
        console.warn('[Email Service] Failed to create test email account:', err.message);
      });
    }
  }

  async sendOtpEmail(email, otp) {
    console.log(`[Email Service] OTP for ${email}: >>> ${otp} <<<`);
    if (!this.transporter) return { success: true, simulated: true };

    try {
      const info = await this.transporter.sendMail({
        from: '"CineAI Recommendation" <noreply@cineai.movie>',
        to: email,
        subject: 'Your CineAI Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 24px; border-radius: 8px;">
            <h2 style="color: #38bdf8;">Welcome to CineAI</h2>
            <p>Your 6-digit one-time verification code is:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #8b5cf6; margin: 16px 0;">
              ${otp}
            </div>
            <p>This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      console.log(`[Email Service] Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.warn(`[Email Service Warning] Failed to deliver email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

export const emailService = new EmailService();
