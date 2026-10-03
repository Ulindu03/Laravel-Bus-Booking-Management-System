'use client';
import React from 'react';
import styles from './HeroSection.module.css';

const HeroSection = () => {
    return (
        <section className={styles.heroWrapper}>
            {/* Background Image */}
            <div className={styles.heroBg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/hero-bg.png"
                    alt="Sri Lanka scenic bus route through hill country"
                    loading="eager"
                    fetchPriority="high"
                />
            </div>

            {/* Overlay */}
            <div className={styles.heroOverlay} />

            {/* Animated grid pattern */}
            <div className={styles.gridPattern} />

            {/* Floating particles */}
            <div className={styles.particles}>
                {[...Array(8)].map((_, i) => (
                    <div key={i} className={styles.particle} />
                ))}
            </div>

            {/* Main Content */}
            <div className={styles.heroContent}>
                <div className={styles.heroBadge}>
                    <span className={styles.badgeDot} />
                    Sri Lanka&apos;s #1 Bus Booking Platform
                </div>

                <h1 className={styles.heroTitle}>
                    Travel Across
                    <span>Paradise Island</span>
                </h1>

                <p className={styles.heroSubtitle}>
                    Book your bus tickets instantly across 185+ routes island-wide.
                    AC luxury coaches, sleeper buses, and express services — all at your fingertips.
                </p>

                <div className={styles.heroActions}>
                    <button className={styles.ctaPrimary} onClick={() => document.getElementById('search-booking')?.scrollIntoView({ behavior: 'smooth' })}>
                        🎫 Book Your Journey
                    </button>
                    <button className={styles.ctaSecondary} onClick={() => document.getElementById('popular-routes')?.scrollIntoView({ behavior: 'smooth' })}>
                        🗺️ Explore Routes
                    </button>
                </div>
            </div>

            {/* 3D Floating Bus */}
            <div className={styles.floatingBus} aria-hidden="true">
                🚌
            </div>

            {/* Scroll Indicator */}
            <div className={styles.scrollIndicator}>
                <span>Scroll</span>
                <div className={styles.scrollLine} />
            </div>
        </section>
    );
};

export default HeroSection;