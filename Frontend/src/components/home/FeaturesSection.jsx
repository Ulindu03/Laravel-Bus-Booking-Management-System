'use client';
import React from 'react';
import styles from './FeaturesSection.module.css';

const features = [
    {
        icon: '📍',
        title: 'Live Tracking',
        description: 'Track your bus in real-time on a map. Know the exact arrival time and plan your journey with confidence.',
    },
    {
        icon: '🔐',
        title: 'Secure Payments',
        description: 'Bank-grade encryption for every transaction. Pay via Visa, Mastercard, or digital wallets safely.',
    },
    {
        icon: '🎧',
        title: '24/7 Support',
        description: 'Our dedicated support team is always available via phone, chat, or email to assist you anytime.',
    },
    {
        icon: '🗺️',
        title: 'Islandwide Routes',
        description: '185+ routes covering every corner of Sri Lanka — from Jaffna to Matara, coast to hill country.',
    },
];

const FeaturesSection = () => {
    return (
        <section className={styles.featuresSection}>
            {/* Background Image */}
            <div className={styles.sectionBg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/features-bg.png" alt="" aria-hidden="true" />
            </div>
            <div className={styles.sectionOverlay} />
            <div className={styles.featuresInner}>
                <p className={styles.sectionLabel}>Why Choose Us</p>
                <h2 className={styles.sectionHeading}>Built for Sri Lankan Travellers</h2>
                <p className={styles.sectionDesc}>
                    Modern technology meets island-wide connectivity. Experience seamless bus booking with features designed for you.
                </p>

                <div className={styles.featuresGrid}>
                    {features.map((feature, index) => (
                        <div key={index} className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                {feature.icon}
                            </div>
                            <h3 className={styles.featureTitle}>{feature.title}</h3>
                            <p className={styles.featureDesc}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
