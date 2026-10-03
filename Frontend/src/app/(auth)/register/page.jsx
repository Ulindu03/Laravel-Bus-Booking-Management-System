"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function Register() {
    const router = useRouter();
    const { register } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (event) => {
        event.preventDefault();
        setError("");

        if (!name || !email || !password || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            await register(name, email, password, confirmPassword);
            router.push("/login");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Email may already be in use. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="register-page">
            <section className="content-grid">
                <aside className="promo-panel">
                    <h2>Book smarter. Travel calmer.</h2>
                    <p>
                        Create your account to manage bookings, track departures,
                        and receive instant seat availability alerts.
                    </p>
                    <div className="promo-stats">
                        <div>
                            <span>99.2%</span>
                            <small>On-time departures</small>
                        </div>
                        <div>
                            <span>450+</span>
                            <small>Daily trips</small>
                        </div>
                        <div>
                            <span>30K+</span>
                            <small>Monthly travelers</small>
                        </div>
                    </div>
                </aside>

                <article className="form-card">
                    <h2>Create Passenger Account</h2>
                    <p className="sub-text">Start booking and managing bus trips in under a minute.</p>

                    <form onSubmit={handleRegister}>
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                        />

                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />

                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a strong password"
                        />

                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                        />

                        {error && <p className="error-text">{error}</p>}

                        <button type="submit" disabled={loading}>
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="login-link">
                        Already registered? <Link href="/login">Go to Login</Link>
                    </p>
                </article>
            </section>

            <style jsx>{`
                .register-page {
                    --primary: #ebf4f6;
                    --secondary: #088395;
                    --accent: #222222;
                    min-height: 100vh;
                    position: relative;
                    overflow: hidden;
                    isolation: isolate;
                    background:
                        linear-gradient(180deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.2)),
                        radial-gradient(80% 55% at 15% 18%, rgba(8, 131, 149, 0.2), transparent 70%),
                        radial-gradient(60% 35% at 78% 78%, rgba(34, 34, 34, 0.11), transparent 72%),
                        linear-gradient(165deg, #eef7f8 0%, #d6ebee 35%, #c5e1e6 72%, #b8d9e0 100%);
                    color: var(--accent);
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                .register-page::before {
                    content: "";
                    position: absolute;
                    left: -10%;
                    right: -10%;
                    bottom: -120px;
                    height: 340px;
                    background: radial-gradient(120% 100% at 50% 100%, rgba(8, 131, 149, 0.22) 0%, rgba(8, 131, 149, 0.12) 38%, rgba(8, 131, 149, 0.04) 58%, transparent 70%);
                    pointer-events: none;
                    z-index: 0;
                }

                .register-page::after {
                    content: "";
                    position: absolute;
                    left: -8%;
                    right: -8%;
                    bottom: 42px;
                    height: 140px;
                    background:
                        linear-gradient(172deg, transparent 12%, rgba(34, 34, 34, 0.18) 43%, rgba(34, 34, 34, 0.22) 49%, rgba(34, 34, 34, 0.1) 64%, transparent 90%),
                        repeating-linear-gradient(100deg, transparent 0 24px, rgba(235, 244, 246, 0.55) 24px 34px, transparent 34px 76px);
                    opacity: 0.45;
                    pointer-events: none;
                    z-index: 0;
                }

                .top-header {
                    border: 1px solid rgba(34, 34, 34, 0.14);
                    background: rgba(255, 255, 255, 0.72);
                    backdrop-filter: blur(6px);
                    border-radius: 16px;
                    padding: 18px 22px;
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .brand-kicker {
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-size: 12px;
                    color: var(--secondary);
                    margin: 0;
                    font-weight: 700;
                }

                .brand-block h1 {
                    margin: 6px 0 0;
                    font-size: clamp(24px, 3vw, 34px);
                    line-height: 1.1;
                }

                .header-demo-details {
                    text-align: right;
                    font-size: 13px;
                    color: rgba(34, 34, 34, 0.86);
                }

                .header-demo-details p {
                    margin: 0 0 6px;
                }

                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.1fr;
                    gap: 22px;
                    flex: 1;
                    position: relative;
                    z-index: 1;
                }

                .promo-panel {
                    background: linear-gradient(170deg, #0b95a9 0%, var(--secondary) 75%);
                    color: #ffffff;
                    border-radius: 20px;
                    padding: clamp(22px, 3vw, 34px);
                    box-shadow: 0 18px 40px rgba(8, 131, 149, 0.25);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .promo-panel h2 {
                    margin: 0 0 12px;
                    font-size: clamp(24px, 2.6vw, 38px);
                    line-height: 1.12;
                }

                .promo-panel p {
                    margin: 0;
                    line-height: 1.7;
                    color: rgba(255, 255, 255, 0.92);
                    max-width: 42ch;
                }

                .promo-stats {
                    margin-top: 28px;
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 12px;
                }

                .promo-stats div {
                    background: rgba(255, 255, 255, 0.14);
                    border: 1px solid rgba(255, 255, 255, 0.34);
                    border-radius: 14px;
                    padding: 10px 12px;
                }

                .promo-stats span {
                    display: block;
                    font-size: 20px;
                    font-weight: 700;
                    line-height: 1.15;
                }

                .promo-stats small {
                    display: block;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.85);
                    margin-top: 5px;
                }

                .form-card {
                    border-radius: 20px;
                    background: #ffffff;
                    border: 1px solid rgba(34, 34, 34, 0.08);
                    padding: clamp(22px, 3vw, 34px);
                    box-shadow: 0 14px 30px rgba(34, 34, 34, 0.12);
                }

                .form-card h2 {
                    margin: 0;
                    font-size: clamp(24px, 2.2vw, 32px);
                }

                .sub-text {
                    margin: 10px 0 18px;
                    color: rgba(34, 34, 34, 0.72);
                }

                form {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                label {
                    margin-top: 6px;
                    font-size: 14px;
                    font-weight: 600;
                }

                input {
                    width: 100%;
                    border-radius: 10px;
                    border: 1px solid rgba(34, 34, 34, 0.2);
                    background: #fafcfc;
                    color: var(--accent);
                    font-size: 15px;
                    padding: 12px 14px;
                    outline: none;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                input:focus {
                    border-color: var(--secondary);
                    box-shadow: 0 0 0 3px rgba(8, 131, 149, 0.18);
                }

                button {
                    margin-top: 14px;
                    border: none;
                    border-radius: 12px;
                    background: var(--secondary);
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 700;
                    padding: 13px 16px;
                    cursor: pointer;
                    transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
                }

                button:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 18px rgba(8, 131, 149, 0.35);
                }

                button:disabled {
                    opacity: 0.72;
                    cursor: not-allowed;
                }

                .error-text {
                    margin: 10px 0 0;
                    color: #b3261e;
                    font-size: 14px;
                    font-weight: 600;
                }

                .login-link {
                    margin: 18px 0 0;
                    font-size: 14px;
                    color: rgba(34, 34, 34, 0.75);
                }

                .login-link :global(a) {
                    color: var(--secondary);
                    font-weight: 700;
                    text-decoration: none;
                }

                .login-link :global(a:hover) {
                    text-decoration: underline;
                }

                .page-footer {
                    margin-top: 24px;
                    border-radius: 16px;
                    padding: 14px 18px;
                    background: rgba(34, 34, 34, 0.92);
                    color: rgba(235, 244, 246, 0.94);
                    display: grid;
                    gap: 4px;
                    font-size: 13px;
                }

                .page-footer p {
                    margin: 0;
                }

                @media (max-width: 980px) {
                    .register-page {
                        padding: 16px;
                    }

                    .top-header {
                        flex-direction: column;
                    }

                    .header-demo-details {
                        text-align: left;
                    }

                    .content-grid {
                        grid-template-columns: 1fr;
                    }

                    .promo-stats {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </main>
    );
}