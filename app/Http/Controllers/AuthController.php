<?php

namespace App\Http\Controllers;

use App\Models\EmailOtp;
use App\Models\Notification;
use App\Models\RestaurantApplication;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Shared password complexity rule - min 8 chars, upper + lower case,
     * a number and a symbol. Used everywhere a password is set so the
     * requirement can never be bypassed by calling the API directly.
     */
    private function passwordRule(): Password
    {
        return Password::min(8)->mixedCase()->numbers()->symbols();
    }

    /*
    |--------------------------------------------------------------------------
    | Email OTP (registration only)
    |--------------------------------------------------------------------------
    | A registration is only accepted for an email that was verified via a
    | 6-digit code sent to that address. The code itself is never re-sent to
    | register() - verifyEmailOtp() marks the row "consumed", and register()
    | only checks that a *recent* consumed row exists for that exact email.
    | This avoids asking the user to re-type the code a second time while
    | still keeping the check fully server-side (a client can never simply
    | claim "verified: true").
    */

    private const OTP_PURPOSE = 'registration';
    private const OTP_TTL_MINUTES = 10;
    private const OTP_VERIFIED_WINDOW_MINUTES = 15;
    private const OTP_MAX_ATTEMPTS = 5;

    public function sendEmailOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $email = $validated['email'];

        if (User::where('email', $email)->exists()) {
            return response()->json([
                'message' => 'This email is already registered. Please log in instead.'
            ], 409);
        }

        // Only one active code per email at a time.
        EmailOtp::where('email', $email)
            ->where('purpose', self::OTP_PURPOSE)
            ->whereNull('consumed_at')
            ->delete();

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        EmailOtp::create([
            'email' => $email,
            'code' => Hash::make($code),
            'purpose' => self::OTP_PURPOSE,
            'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
        ]);

        Mail::raw(
            "Your QuickSeat verification code is: {$code}\nIt expires in " . self::OTP_TTL_MINUTES . " minutes.",
            function ($message) use ($email) {
                $message->to($email)->subject('Your QuickSeat verification code');
            }
        );

        return response()->json([
            'message' => 'A verification code has been sent to your email.'
        ]);
    }

    public function verifyEmailOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $otp = EmailOtp::where('email', $validated['email'])
            ->where('purpose', self::OTP_PURPOSE)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        if (!$otp) {
            return response()->json([
                'message' => 'No active verification code for this email. Please request a new one.'
            ], 422);
        }

        if ($otp->attempts >= self::OTP_MAX_ATTEMPTS) {
            return response()->json([
                'message' => 'Too many incorrect attempts. Please request a new code.'
            ], 422);
        }

        if (!Hash::check($validated['code'], $otp->code)) {
            $otp->increment('attempts');

            return response()->json([
                'message' => 'Invalid verification code.'
            ], 422);
        }

        $otp->update(['consumed_at' => now()]);

        return response()->json([
            'message' => 'Email verified successfully.'
        ]);
    }

    private function emailWasRecentlyVerified(string $email): bool
    {
        return EmailOtp::where('email', $email)
            ->where('purpose', self::OTP_PURPOSE)
            ->whereNotNull('consumed_at')
            ->where('consumed_at', '>=', now()->subMinutes(self::OTP_VERIFIED_WINDOW_MINUTES))
            ->exists();
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'string', $this->passwordRule()],
            'account_type' => 'nullable|in:customer,restaurant',
            'restaurant_name' => 'required_if:account_type,restaurant|string|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        if (!$this->emailWasRecentlyVerified($validated['email'])) {
            return response()->json([
                'message' => 'Please verify your email address before creating an account.'
            ], 422);
        }

        $accountType = $validated['account_type'] ?? 'customer';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'email_verified_at' => now(),
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        if ($accountType === 'restaurant') {
            $application = RestaurantApplication::create([
                'user_id' => $user->id,
                'restaurant_name' => $validated['restaurant_name'],
                'phone' => $validated['phone'] ?? null,
                'status' => 'pending',
            ]);

            $this->notifyAdmins($user, $application);

            return response()->json([
                'message' => 'Your restaurant registration request has been submitted for review. You can use your account as a customer in the meantime.',
                'user' => $user,
                'token' => $token,
                'restaurant_application' => $application,
            ], 201);
        }

        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    private function notifyAdmins(User $applicant, RestaurantApplication $application): void
    {
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'reservation_id' => null,
                'message' => "New restaurant registration request: \"{$application->restaurant_name}\" from {$applicant->name} ({$applicant->email}).",
                'type' => 'restaurant_application_request',
                'is_read' => false,
            ]);
        }
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'login_as' => 'nullable|in:customer,restaurant',
        ]);

        // managedRestaurants is eager-loaded so the frontend immediately
        // knows "which restaurant is mine" (e.g. to grey out booking at any
        // other restaurant) without a second request right after login.
        $user = User::with('managedRestaurants:id,name,manager_id')
            ->where('email', $validated['email'])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.'
            ], 401);
        }

        $loginAs = $validated['login_as'] ?? 'customer';

        // "Customer" mode never restricts by role (unchanged behaviour) -
        // "Restaurant" mode requires the account to actually hold the
        // restaurant role, verified here from the stored role, never from
        // whatever the frontend happened to send.
        if ($loginAs === 'restaurant' && $user->role !== 'restaurant') {
            return response()->json([
                'message' => $this->restaurantLoginDenialMessage($user),
            ], 403);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    private function restaurantLoginDenialMessage(User $user): string
    {
        $application = RestaurantApplication::where('user_id', $user->id)
            ->latest()
            ->first();

        if (!$application) {
            return 'This account does not have restaurant access.';
        }

        if ($application->status === 'pending') {
            return 'Your restaurant registration is still under review.';
        }

        if ($application->status === 'rejected') {
            return 'Sorry, your restaurant account request was not approved. You cannot access the platform as a restaurant.';
        }

        return 'This account does not have restaurant access.';
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => ['required', 'string', $this->passwordRule()],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Your current password is incorrect.'
            ], 422);
        }

        $user->update(['password' => $validated['new_password']]);

        return response()->json([
            'message' => 'Password changed successfully.'
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful.'
        ]);
    }
}
