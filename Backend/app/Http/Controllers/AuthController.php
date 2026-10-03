<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Models\User;
use App\Mail\AdminLoginOtp;
use Carbon\Carbon;

class AuthController extends Controller
{
    /**
     * Register a new user account.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|min:2|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'user',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success'      => true,
            'message'      => 'Account created successfully',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user,
        ], 201);
    }

    /**
     * Authenticate a user and issue a Sanctum token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        // Check if user is an admin or super_admin and needs OTP
        if (in_array($user->role, ['admin', 'super_admin'])) {
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store OTP in cache for 10 minutes
            Cache::put("admin_otp_{$user->id}", $otp, now()->addMinutes(10));
            
            // Send OTP email
            Mail::to($user->email)->send(new AdminLoginOtp($otp, $user->name));
            
            return response()->json([
                'success'      => true,
                'requires_otp' => true,
                'message'      => 'OTP sent to your email',
                'email'        => $user->email,
            ], 200);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success'      => true,
            'message'      => 'Login successful',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user,
        ], 200);
    }

    /**
     * Verify OTP for admin login.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
            'otp'      => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        $cachedOtp = Cache::get("admin_otp_{$user->id}");

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP',
            ], 401);
        }

        // OTP is valid, clear it
        Cache::forget("admin_otp_{$user->id}");

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success'      => true,
            'message'      => 'Login successful',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user,
        ], 200);
    }

    /**
     * Revoke all tokens for the authenticated user.
     */
    public function logout(Request $request)
    {
        auth()->user()->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ], 200);
    }

    /**
     * Return the currently authenticated user.
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user'    => $request->user(),
        ], 200);
    }

    /**
     * Send a password reset link to the given email.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Delete any previous reset tokens for this email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Generate a plain token and store its hash
        $plainToken = Str::random(64);

        DB::table('password_reset_tokens')->insert([
            'email'      => $request->email,
            'token'      => Hash::make($plainToken),
            'created_at' => Carbon::now(),
        ]);

        // Build a reset URL pointing to the frontend
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $resetLink   = $frontendUrl . '/reset-password?token=' . $plainToken . '&email=' . urlencode($request->email);

        // Log the link (MAIL_MAILER=log, so it goes to storage/logs/laravel.log)
        Mail::raw("Click the link below to reset your password:\n\n{$resetLink}\n\nThis link expires in 60 minutes.", function ($message) use ($request) {
            $message->to($request->email)
                    ->subject('Serendib Go – Password Reset');
        });

        return response()->json([
            'success' => true,
            'message' => 'Password reset link has been sent to your email.',
        ], 200);
    }

    /**
     * Reset the user's password using a valid token.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|email|exists:users,email',
            'token'    => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
                    ->where('email', $request->email)
                    ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset token.',
            ], 400);
        }

        // Check if the token has expired (60 minutes)
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'success' => false,
                'message' => 'Reset token has expired. Please request a new one.',
            ], 400);
        }

        // Verify the plain token against the stored hash
        if (!Hash::check($request->token, $record->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset token.',
            ], 400);
        }

        // Update the password
        $user = User::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Clean up the used token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset successfully. You can now log in.',
        ], 200);
    }
}
