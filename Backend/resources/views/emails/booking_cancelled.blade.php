<!DOCTYPE html>
<html>
<head>
    <title>Booking Cancelled</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #dc3545;">Booking Cancelled</h2>
        <p>Dear {{ $booking->user->name }},</p>
        <p>This email is to confirm that your booking (Ref: <strong>{{ $booking->booking_ref }}</strong>) has been successfully cancelled.</p>
        
        <p><strong>Route:</strong> {{ $booking->schedule->route->origin }} to {{ $booking->schedule->route->destination }}</p>
        
        <p>If you have already made a payment, a refund process has been initiated according to our cancellation policy and will be credited to your original payment method within 3-5 business days.</p>
        
        <p>If you cancelled this by mistake or wish to book a new trip, please visit our website.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">&copy; {{ date('Y') }} Serendib Go. All rights reserved.</p>
    </div>
</body>
</html>
