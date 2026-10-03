<!DOCTYPE html>
<html>
<head>
    <title>Admin Login OTP</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">Admin Login Verification</h2>
        <p>Hello {{ $userName }},</p>
        <p>You are attempting to log into the Serendib Go Admin Dashboard. Please use the following One-Time Password (OTP) to complete your login:</p>
        
        <div style="background-color: #f8f9fa; border: 1px solid #ddd; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            {{ $otp }}
        </div>
        
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #d9534f; font-size: 12px;">If you did not request this code, someone may be trying to access your account. Please secure your account immediately.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">&copy; {{ date('Y') }} Serendib Go. All rights reserved.</p>
    </div>
</body>
</html>
