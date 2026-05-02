const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs").promises;
const ejs = require("ejs");


 
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT) || 587, 
  secure: false, 
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS 
  }
});

// 🔍 Verify SMTP connection ONCE at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Brevo SMTP connection failed:", error.message);
  } else {
    console.log("✅ Brevo SMTP connected successfully");
  }
});

const sendOtpEmail = async ({ checkedEmail, username, otp, temp }) => {
  try {
    var templatePath;
    const templatePathRegister = path.join(
      __dirname,
      "../../../view/register.ejs"
    );

       const templatePathVerify = path.join(
      __dirname,
      "../../../view/verify.ejs"
    );
       const templatePathForgotPassword = path.join(
      __dirname,
      "../../../view/forgotpassword.ejs"
    );
        const templatePathResend = path.join(
      __dirname,
      "../../../view/resend.ejs"
    );
    
    console.log(checkedEmail);
    console.log(otp);
    if (temp === "register") {
      templatePath = templatePathRegister;
    } else if (temp === "verify") {
      templatePath = templatePathVerify;
    } else if (temp === "forgotpassword") {
      templatePath = templatePathForgotPassword;
    } else if(temp === "resend"){
      templatePath = templatePathResend;
    }

    const template = await fs.readFile(templatePath, "utf-8");

    const html = ejs.render(template, {
      username,
      otp
    });

    await transporter.sendMail({
      from: `"Your App" <${process.env.USER_EMAIL}>`,
      to: checkedEmail,
      subject: "Your OTP Code",
      html
    });

    console.log(`✅ OTP sent to ${checkedEmail}`);
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err.message);
    throw new Error("Email sending failed");
  }
};

module.exports = { sendOtpEmail };
