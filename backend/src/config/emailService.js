import nodemailer from 'nodemailer';

// ── Nodemailer transporter ──────────────────────────────────────────────────
// Cần thêm vào .env:
//   GMAIL_USER=your_email@gmail.com
//   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  (Gmail App Password, không phải mật khẩu thường)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Gửi email OTP reset mật khẩu
 * @param {string} toEmail   - Email người nhận
 * @param {string} otp       - Mã OTP 6 số
 */
export const sendResetOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Tu Tiên - Đạo Tâm Bất Diệt" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: '🔑 Mã xác thực đặt lại mật khẩu Tu Tiên',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#0a0b0d;font-family:'Segoe UI',Tahoma,sans-serif;">
        <div style="max-width:480px;margin:40px auto;background:linear-gradient(135deg,#111318 0%,#1a1b22 100%);border-radius:16px;border:1px solid rgba(242,202,80,0.2);overflow:hidden;">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,rgba(242,202,80,0.15),rgba(176,102,255,0.1));padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(242,202,80,0.15);">
            <div style="font-size:32px;margin-bottom:8px;">⚡</div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#f2ca50;letter-spacing:0.05em;">Tu Tiên</h1>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(160,150,130,0.8);letter-spacing:0.15em;text-transform:uppercase;">Đạo Tâm Bất Diệt</p>
          </div>

          <!-- Content -->
          <div style="padding:32px;">
            <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#e8e0d0;">Đặt lại mật khẩu</h2>
            <p style="margin:0 0 24px;font-size:14px;color:rgba(160,150,130,0.9);line-height:1.6;">
              Đạo hữu đã yêu cầu đặt lại mật khẩu. Nhập mã OTP bên dưới để tiếp tục:
            </p>

            <!-- OTP Box -->
            <div style="background:rgba(242,202,80,0.08);border:2px solid rgba(242,202,80,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
              <div style="font-size:11px;color:rgba(160,150,130,0.7);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;">Mã xác thực</div>
              <div style="font-size:40px;font-weight:700;letter-spacing:0.25em;color:#f2ca50;font-family:monospace;">${otp}</div>
            </div>

            <p style="margin:0 0 8px;font-size:13px;color:rgba(160,150,130,0.7);">
              ⏱️ Mã có hiệu lực trong <strong style="color:#f2ca50;">10 phút</strong>.
            </p>
            <p style="margin:0;font-size:13px;color:rgba(160,150,130,0.7);">
              🔒 Nếu đây không phải bạn, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
            <p style="margin:0;font-size:11px;color:rgba(160,150,130,0.4);">Tu Tiên Online · Đường tu vạn dặm bắt đầu từ một bước chân</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
