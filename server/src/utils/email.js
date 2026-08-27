const nodemailer = require('nodemailer');

// Store test account so we don't create one on every single email request
let testAccount = null;
let transporter = null;

const initTransporter = async () => {
  if (!transporter) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      // Use production/custom SMTP if provided in .env
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback to Ethereal mock for development
      console.log('Generating Ethereal test account for emails...');
      testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
  }
  return transporter;
};

const sendEmail = async (options) => {
  try {
    const mailTransporter = await initTransporter();

    const mailOptions = {
      from: '"SmartRent TZ" <noreply@smartrent.co.tz>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`,
    };

    const info = await mailTransporter.sendMail(mailOptions);

    console.log('----------------------------------------------------');
    console.log('📧 EMAIL SENT: %s', info.messageId);
    if (!process.env.SMTP_HOST) {
      console.log('🔗 PREVIEW EMAIL: %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');
    
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
  }
};

module.exports = sendEmail;
