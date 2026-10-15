'use client';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import { usePathname } from 'next/navigation';

const Header = () => {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Prevent background scrolling when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    if (pathname.startsWith('/admin')) return null;

    const handleScrollTo = (id) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className={styles.siteHeader}>
            {/* Animated top accent line */}
            <div className={styles.accentLine} />

            <div className={styles.headerInner}>
                {/* Brand - links to home */}
                <Link href="/" className={styles.brandWrap} onClick={() => setMobileMenuOpen(false)}>
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

                {/* Desktop Navigation Links */}
                <nav className={styles.navLinks}>
                    <a href="#search-booking" onClick={(e) => { e.preventDefault(); handleScrollTo('search-booking'); }} className={styles.navLink}>
                        <span className={styles.navIcon}>🔍</span>
                        Book Now
                    </a>
                    <a href="#popular-routes" onClick={(e) => { e.preventDefault(); handleScrollTo('popular-routes'); }} className={styles.navLink}>
                        <span className={styles.navIcon}>🗺️</span>
                        Routes
                    </a>
                    <Link href="/dashboard" className={styles.navLink}>
                        <span className={styles.navIcon}>📋</span>
                        My Trips
                    </Link>
                </nav>

                {/* Desktop Right Section */}
                <div className={styles.headerRight}>
                    <div className={styles.supportBadge}>
                        <div className={styles.supportPulse} />
                        <span className={styles.supportIcon}>📞</span>
                        <div className={styles.supportText}>
                            <span className={styles.supportLabel}>24/7 Support</span>
                            <a href="tel:+94112345678" className={styles.supportNumber}>+94 11 234 5678</a>
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

                    {/* Mobile Hamburger Toggle Button */}
                    <button
                        type="button"
                        className={`${styles.hamburgerBtn} ${mobileMenuOpen ? styles.hamburgerOpen : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle Navigation"
                        aria-expanded={mobileMenuOpen}
                    >
                        <span className={styles.hamburgerLine} />
                        <span className={styles.hamburgerLine} />
                        <span className={styles.hamburgerLine} />
                    </button>
                </div>
            </div>

            {/* Mobile Drawer Overlay */}
            {mobileMenuOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Drawer */}
            <div className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.mobileDrawerOpen : ''}`}>
                <div className={styles.drawerHeader}>
                    <div className={styles.drawerBrand}>
                        <span className={styles.drawerBrandKicker}>Serendib Go</span>
                        <span className={styles.drawerBrandTitle}>Navigation</span>
                    </div>
                    <button
                        type="button"
                        className={styles.drawerCloseBtn}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.drawerNav}>
                    <a
                        href="#search-booking"
                        onClick={(e) => { e.preventDefault(); handleScrollTo('search-booking'); }}
                        className={styles.drawerNavLink}
                    >
                        <span className={styles.drawerNavIcon}>🔍</span>
                        <span>Book Now</span>
                    </a>
                    <a
                        href="#popular-routes"
                        onClick={(e) => { e.preventDefault(); handleScrollTo('popular-routes'); }}
                        className={styles.drawerNavLink}
                    >
                        <span className={styles.drawerNavIcon}>🗺️</span>
                        <span>Routes</span>
                    </a>
                    <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className={styles.drawerNavLink}
                    >
                        <span className={styles.drawerNavIcon}>📋</span>
                        <span>My Trips</span>
                    </Link>
                </div>

                <div className={styles.drawerDivider} />

                {/* Mobile Support Card */}
                <div className={styles.drawerSupport}>
                    <div className={styles.drawerSupportBadge}>
                        <span className={styles.supportPulse} />
                        <span className={styles.drawerSupportIcon}>📞</span>
                        <div>
                            <span className={styles.supportLabel}>24/7 Support Hotline</span>
                            <a href="tel:+94112345678" className={styles.supportNumber}>+94 11 234 5678</a>
                        </div>
                    </div>
                </div>

                {/* Mobile Auth Buttons */}
                <div className={styles.drawerAuth}>
                    <Link
                        href="/auth/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className={styles.drawerLoginBtn}
                    >
                        Login
                    </Link>
                    <Link
                        href="/auth/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className={styles.drawerSignupBtn}
                    >
                        Sign Up
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;