const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  /**
   * 1. CREATE transporter
   * 2. Define the mail options
   * 3. Actually send the email
   * */

  // 1.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //   2.
  const mailOptions = {
    from: 'Gersh La paix <nsenga@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:

    // 3.
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
