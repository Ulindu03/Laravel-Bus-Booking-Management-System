'use client';
import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import { usePathname } from 'next/navigation';

const Header = () => {
    const pathname = usePathname();
    if (pathname.startsWith('/admin')) return null;

    return (
        <header className={styles.siteHeader}>
            {/* Animated top accent line */}
            <div className={styles.accentLine} />

            <div className={styles.headerInner}>
                {/* Brand - links to home */}
                <Link href="/" className={styles.brandWrap}>
                    <div className={styles.logoFrame}>
                        <div className={styles.logoGlow} />
                        <Image
                            src="/images/logo.png"
                            alt="Serendib Go"
                            width={128}
                            height={72}
                            priority
                            className={styles.logoImage}
                        />
                    </div>
                    <div className={styles.brandText}>
                        <p className={styles.brandKicker}>Smart Bus Booking</p>
                        <h1 className={styles.brandName}>Serendib Go</h1>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className={styles.navLinks}>
                    <a href="#search-booking" onClick={(e) => { e.preventDefault(); document.getElementById('search-booking')?.scrollIntoView({ behavior: 'smooth' }); }} className={styles.navLink}>
                        <span className={styles.navIcon}>🔍</span>
                        Book Now
                    </a>
                    <a href="#popular-routes" onClick={(e) => { e.preventDefault(); document.getElementById('popular-routes')?.scrollIntoView({ behavior: 'smooth' }); }} className={styles.navLink}>
                        <span className={styles.navIcon}>🗺️</span>
                        Routes
                    </a>
                    <Link href="/dashboard" className={styles.navLink}>
                        <span className={styles.navIcon}>📋</span>
                        My Trips
                    </Link>
                </nav>

                {/* Right Section */}
                <div className={styles.headerRight}>
                    <div className={styles.supportBadge}>
                        <div className={styles.supportPulse} />
                        <span className={styles.supportIcon}>📞</span>
                        <div className={styles.supportText}>
                            <span className={styles.supportLabel}>24/7 Support</span>
                            <span className={styles.supportNumber}>+94 11 234 5678</span>
                        </div>
                    </div>
                    <div className={styles.authButtons}>
                        <Link href="/auth/login" className={styles.loginBtn}>
                            Login
                        </Link>
                        <Link href="/auth/register" className={styles.signupBtn}>
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;