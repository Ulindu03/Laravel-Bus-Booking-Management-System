'use client';
import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";
import { usePathname } from 'next/navigation';

const Footer = () => {
    const pathname = usePathname();
    if (pathname.startsWith('/admin')) return null;

    return (
        <footer className={styles.siteFooter}>
            {/* Top accent line */}
            <div className={styles.footerAccent} />

            <div className={styles.footerInner}>
                {/* Row 1: Main Content */}
                <div className={styles.footerTop}>
                    {/* Brand Column */}
                    <div className={styles.footerBrand}>
                        <div className={styles.brandRow}>
                            <div className={styles.logoWrap}>
                                <Image
                                    src="/images/logo.png"
                                    alt="Serendib Go"
                                    width={56}
                                    height={32}
                                    className={styles.footerLogo}
                                />
                            </div>
                            <h3 className={styles.brandTitle}>Serendib Go</h3>
                        </div>
                        <p className={styles.brandTagline}>
                            Sri Lanka&apos;s most trusted bus booking platform. Travel smarter, arrive happier.
                        </p>
                        <div className={styles.socialLinks}>
                            <a href="#" className={styles.socialLink} aria-label="Facebook">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                            </a>
                            <a href="#" className={styles.socialLink} aria-label="Twitter">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                            </a>
                            <a href="#" className={styles.socialLink} aria-label="Instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                            </a>
                            <a href="#" className={styles.socialLink} aria-label="YouTube">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.footerColumn}>
                        <h4 className={styles.columnTitle}>Quick Links</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/#search-booking">Book a Bus</Link></li>
                            <li><Link href="/#popular-routes">Route Map</Link></li>
                            <li><Link href="/dashboard">My Bookings</Link></li>
                            <li><Link href="/offers">Offers & Deals</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className={styles.footerColumn}>
                        <h4 className={styles.columnTitle}>Support</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/help">Help Center</Link></li>
                            <li><Link href="/dashboard">Cancel Booking</Link></li>
                            <li><Link href="/refunds">Refund Policy</Link></li>
                            <li><Link href="/contact">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className={styles.footerColumn}>
                        <h4 className={styles.columnTitle}>Contact</h4>
                        <div className={styles.contactList}>
                            <div className={styles.contactItem}>
                                <span className={styles.contactIcon}>📍</span>
                                <span>12 Central Mobility Hub, Colombo</span>
                            </div>
                            <div className={styles.contactItem}>
                                <span className={styles.contactIcon}>📧</span>
                                <span>reservations@serendibgo.com</span>
                            </div>
                            <div className={styles.contactItem}>
                                <span className={styles.contactIcon}>📞</span>
                                <span>+94 11 234 5678</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className={styles.footerDivider} />

                {/* Bottom Row */}
                <div className={styles.footerBottom}>
                    <p className={styles.copyright}>
                        © 2026 Serendib Go. All rights reserved.
                    </p>
                    <div className={styles.footerBadges}>
                        <span className={styles.badge}>🛡️ SSL Secured</span>
                        <span className={styles.badge}>🚌 185+ Routes</span>
                        <span className={styles.badge}>⭐ 4.8 Rating</span>
                        <span className={styles.badge}>🕐 24/7 Support</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;