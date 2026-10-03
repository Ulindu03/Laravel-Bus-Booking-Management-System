'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import styles from './page.module.css';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect');
    const { login, verifyOtp } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [requiresOtp, setRequiresOtp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        
        if (requiresOtp && !otp) {
            setError('Please enter the OTP sent to your email');
            return;
        }

        try {
            setLoading(true);
            
            if (requiresOtp) {
                const user = await verifyOtp(email, password, otp);
                if (redirectTo) {
                    router.push(redirectTo);
                } else if (user?.role === 'admin' || user?.role === 'super_admin') {
                    router.push('/admin/home');
                } else {
                    router.push('/dashboard');
                }
            } else {
                const response = await login(email, password);
                
                if (response.requiresOtp) {
                    setRequiresOtp(true);
                    setError(null);
                } else {
                    const user = response.user;
                    if (redirectTo) {
                        router.push(redirectTo);
                    } else if (user?.role === 'admin' || user?.role === 'super_admin') {
                        router.push('/admin/home');
                    } else {
                        router.push('/dashboard');
                    }
                }
            }
        } catch (err) {
            if (requiresOtp) {
                setError('Invalid or expired OTP. Please try again.');
            } else {
                setError('Invalid email or password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.loginPage}>
            {/* Background */}
            <div className={styles.bgLayer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/hero-bg.png" alt="" aria-hidden="true" />
            </div>
            <div className={styles.bgOverlay} />
            <div className={styles.bgOrb} />
            <div className={styles.bgOrb} />
            <div className={styles.bgOrb} />

            {/* Content */}
            <div className={styles.contentWrap}>
                {/* Left Brand Panel */}
                <div className={styles.brandPanel}>
                    <div className={styles.brandLogo}>
                        <div className={styles.logoIconWrap}>🚌</div>
                        <div className={styles.logoText}>
                            <span className={styles.logoLabel}>Smart Bus Booking</span>
                            <h2 className={styles.logoName}>Serendib Go</h2>
                        </div>
                    </div>

                    <h1 className={styles.brandHeading}>
                        Welcome back to<br />
                        <span>Paradise Transit</span>
                    </h1>

                    <p className={styles.brandDesc}>
                        Login to access your bookings, track buses in real-time, 
                        and explore 185+ routes across beautiful Sri Lanka.
                    </p>

                    <div className={styles.brandFeatures}>
                        <div className={styles.brandFeature}>
                            <span className={styles.featureCheck}>✓</span>
                            Instant booking confirmation
                        </div>
                        <div className={styles.brandFeature}>
                            <span className={styles.featureCheck}>✓</span>
                            Real-time bus tracking
                        </div>
                        <div className={styles.brandFeature}>
                            <span className={styles.featureCheck}>✓</span>
                            Secure payment gateway
                        </div>
                        <div className={styles.brandFeature}>
                            <span className={styles.featureCheck}>✓</span>
                            24/7 customer support
                        </div>
                    </div>
                </div>

                {/* Login Card */}
                <div className={styles.loginCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>{requiresOtp ? 'Verification Required' : 'Sign In'}</h2>
                        <p className={styles.cardSubtitle}>
                            {requiresOtp ? 'Enter the 6-digit OTP sent to your email.' : 'Enter your credentials to continue'}
                        </p>
                    </div>

                    {error && (
                        <div className={styles.errorMsg}>
                            <span className={styles.errorIcon}>⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        
                        {!requiresOtp ? (
                            <>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>Email Address</label>
                                    <div className={styles.inputWrap}>
                                        <span className={styles.inputIcon}>📧</span>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className={styles.inputField}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                            disabled={requiresOtp}
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel}>Password</label>
                                    <div className={styles.inputWrap}>
                                        <span className={styles.inputIcon}>🔒</span>
                                        <input
                                            type="password"
                                            placeholder="Enter your password"
                                            className={styles.inputField}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                            disabled={requiresOtp}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formOptions}>
                                    <label className={styles.rememberMe}>
                                        <input type="checkbox" className={styles.checkbox} />
                                        <span className={styles.rememberText}>Remember me</span>
                                    </label>
                                    <a href="#" className={styles.forgotLink}>Forgot password?</a>
                                </div>
                            </>
                        ) : (
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>One-Time Password (OTP)</label>
                                <div className={styles.inputWrap}>
                                    <span className={styles.inputIcon}>🔑</span>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        maxLength={6}
                                        className={styles.inputField}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        style={{ letterSpacing: '8px', fontSize: '1.25rem', textAlign: 'center' }}
                                        autoComplete="one-time-code"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitBtn}
                        >
                            {loading ? (requiresOtp ? 'Verifying...' : 'Signing in...') : (requiresOtp ? 'Verify OTP →' : 'Sign In →')}
                        </button>
                    </form>

                    <div className={styles.divider}>
                        <div className={styles.dividerLine} />
                        <span className={styles.dividerText}>or</span>
                        <div className={styles.dividerLine} />
                    </div>

                    <p className={styles.registerPrompt}>
                        Don&apos;t have an account?
                        <Link href="/auth/register" className={styles.registerLink}>
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
