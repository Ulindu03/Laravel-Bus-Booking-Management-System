"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import styles from "./page.module.css";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect');
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
            if (redirectTo) {
                router.push(redirectTo);
            } else {
                router.push("/login");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Email may already be in use. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.registerPage}>
            <section className={styles.shell}>
                <section className={styles.contentGrid}>
                    <aside className={styles.promoPanel}>
                        <p className={styles.kicker}>Join for free</p>
                        <h2>
                            Unlock the traveler inside you,
                            <br />
                            and ride with confidence.
                        </h2>
                        <p>
                            Create your Serendib Go account to book routes faster,
                            manage your trips, and receive instant journey updates.
                        </p>
                        <div className={styles.actionRow}>
                            <button type="button" className={styles.ghostButton}>Explore routes</button>
                            <button type="button" className={styles.primaryCta}>Book now</button>
                        </div>
                        <div className={styles.promoStats}>
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

                    <article className={styles.formCard}>
                        <h2>Create new account.</h2>
                        <p className={styles.subText}>Start booking and managing bus trips in under a minute.</p>

                        <form onSubmit={handleRegister} className={styles.form}>
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

                            {error && <p className={styles.errorText}>{error}</p>}

                            <button type="submit" disabled={loading} className={styles.submitButton}>
                                {loading ? "Creating account..." : "Create Account"}
                            </button>
                        </form>

                        <p className={styles.loginLink}>
                            Already registered? <Link href="/login">Go to Login</Link>
                        </p>
                    </article>
                </section>
            </section>
        </main>
    );
}

export default function Register() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
}