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

const sendOtpEmail = async ({ checkedEmail, username, otp, temp, subject, content, html, deviceName, deviceIPAddress }) => {
  try {
    if (!checkedEmail || typeof checkedEmail !== "string" || !checkedEmail.trim()) {
      throw new Error("Email recipient is required");
    }

    const recipient = checkedEmail.trim();
    let templatePath;
    let emailSubject = subject;
    let emailHtml = html;

    const templatePathRegister = path.join(
      __dirname,
      "../../../view/register.ejs"
    );

    const templatePathLogin = path.join(
      __dirname,
      "../../../view/login.ejs"
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

    if (!emailSubject) {
      if (temp === "register") {
        emailSubject = "Verify your account";
      } else if (temp === "verify") {
        emailSubject = "Email verification";
      } else if (temp === "forgotpassword") {
        emailSubject = "Password reset OTP";
      } else if (temp === "resend") {
        emailSubject = "Resend OTP";
      } else if (temp === "login") {
        emailSubject = "Login OTP";
      } else if (temp === "login_notification") {
        emailSubject = "Login alert";
      } else if (temp === "password_changed") {
        emailSubject = "Password changed successfully";
      } else if (temp === "password_reset") {
        emailSubject = "Password reset successful";
      } else {
        emailSubject = "Notification from Power Chain";
      }
    }

    if (temp === "register") {
      templatePath = templatePathRegister;
    } else if (temp === "verify") {
      templatePath = templatePathVerify;
    } else if (temp === "forgotpassword") {
      templatePath = templatePathForgotPassword;
    } else if (temp === "resend") {
      templatePath = templatePathResend;
  
    } else if (temp === "login_notification") {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2>Login Alert</h2>
          <p>Hi ${username || "User"},</p>
          <p>Your account was successfully logged in with:</p>
          <ul>
            <li><strong>Device:</strong> ${deviceName || "Unknown device"}</li>
            <li><strong>IP Address:</strong> ${deviceIPAddress || "Unknown IP"}</li>
          </ul>
          <p>If this wasn't you, please change your password immediately.</p>
          <hr />
          <p style="font-size: 0.9em; color: #666;">Power Chain Security Team</p>
        </div>
      `;
    } else if (temp === "password_changed") {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2>Password Changed</h2>
          <p>Hi ${username || "User"},</p>
          <p>Your password was changed successfully.</p>
          <p>If you did not perform this action, please reset your password immediately and contact support.</p>
          <hr />
          <p style="font-size: 0.9em; color: #666;">Power Chain Security Team</p>
        </div>
      `;
    } else if (temp === "password_reset") {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2>Password Reset</h2>
          <p>Hi ${username || "User"},</p>
          <p>Your password has been reset successfully.</p>
          <p>If you did not request this reset, please secure your account immediately.</p>
          <hr />
          <p style="font-size: 0.9em; color: #666;">Power Chain Security Team</p>
        </div>
      `;
    }

    if (templatePath) {
      const template = await fs.readFile(templatePath, "utf-8");
      emailHtml = ejs.render(template, {
        username,
        otp
      });
    }

    if (!emailHtml) {
      throw new Error("Failed to build email content");
    }

    await transporter.sendMail({
      from: `"Your App" <${process.env.USER_EMAIL || process.env.BREVO_SMTP_USER}>`,
      to: recipient,
      subject: emailSubject,
      html: emailHtml
    });

    console.log(`✅ Email sent to ${recipient}`);
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err.message);
    throw new Error("Email sending failed");
  }
};

module.exports = { sendOtpEmail };
