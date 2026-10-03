'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from './StatsSection.module.css';

const stats = [
    { icon: '😊', number: 66152, suffix: '+', label: 'Happy Customers' },
    { icon: '🛣️', number: 185, suffix: '+', label: 'Live Routes' },
    { icon: '🏙️', number: 48, suffix: '+', label: 'Cities Connected' },
    { icon: '🚌', number: 320, suffix: '+', label: 'Daily Departures' },
];

function useCountUp(target, duration = 2000, start = false) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!start) return;
        let startTime = null;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration, start]);

    return count;
}

function StatCard({ icon, number, suffix, label }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const animatedNumber = useCountUp(number, 2200, visible);

    return (
        <div ref={ref} className={styles.statCard}>
            <div className={styles.statIcon}>{icon}</div>
            <p className={styles.statNumber}>
                {animatedNumber.toLocaleString()}{suffix}
            </p>
            <p className={styles.statLabel}>{label}</p>
        </div>
    );
}

const StatsSection = () => {
    return (
        <section className={styles.statsSection}>
            {/* Background Image */}
            <div className={styles.sectionBg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/stats-bg.png" alt="" aria-hidden="true" />
            </div>
            <div className={styles.sectionOverlay} />
            <div className={styles.statsInner}>
                <p className={styles.sectionLabel}>Our Impact</p>
                <h2 className={styles.sectionHeading}>Trusted by Thousands Across Sri Lanka</h2>

                <div className={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <StatCard
                            key={index}
                            icon={stat.icon}
                            number={stat.number}
                            suffix={stat.suffix}
                            label={stat.label}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
