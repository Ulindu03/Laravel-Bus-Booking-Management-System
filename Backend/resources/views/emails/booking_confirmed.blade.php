<!DOCTYPE html>
<html>
<head>
    <title>Booking Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        @php
            $passengerName = $booking->guest_name 
                ?? $booking->user?->name 
                ?? $booking->bookedSeats->first()?->passenger_name 
                ?? 'Valued Passenger';
            $firstSeat = $booking->bookedSeats->first();
            $origin = $firstSeat?->boarding_stop ?? $booking->schedule->route->origin;
            $destination = $firstSeat?->alighting_stop ?? $booking->schedule->route->destination;
        @endphp
        <h2 style="color: #28a745;">Booking Confirmed! 🎉</h2>
        <p>Dear {{ $passengerName }},</p>
        <p>Your bus booking has been successfully confirmed. Below are your travel details:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Booking Reference:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{ $booking->booking_ref }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Route / Segment:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{ $origin }} to {{ $destination }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Departure:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{ \Carbon\Carbon::parse($booking->schedule->departure_time)->format('F j, Y, g:i A') }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Bus:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{ $booking->schedule->bus->name }} (Reg: {{ $booking->schedule->bus->bus_number }})</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Seats:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{ $booking->bookedSeats->pluck('seat_number')->implode(', ') }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total Amount:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">Rs. {{ number_format($booking->total_amount, 2) }}</td>
            </tr>
        </table>
        
        <p>Please arrive at the departure location at least 15 minutes before the departure time. Have a safe journey!</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">&copy; {{ date('Y') }} Serendib Go. All rights reserved.</p>
    </div>
</body>
</html>
