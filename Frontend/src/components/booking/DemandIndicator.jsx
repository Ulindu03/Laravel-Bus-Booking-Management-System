'use client';

import React from 'react';
import styles from './DemandIndicator.module.css';

/**
 * DemandIndicator — Color-coded demand badge
 * Shows High / Medium / Low demand level with visual indicators
 * Used on search results and seat map pages
 */
const DemandIndicator = ({ level, predictedDemand, availableSeats, totalSeats, compact = false }) => {
    // Determine demand level from props or calculate from seats
    const getDemandLevel = () => {
        if (level) return level.toLowerCase();
        if (availableSeats != null && totalSeats) {
            const ratio = availableSeats / totalSeats;
            if (ratio <= 0.2) return 'high';
            if (ratio <= 0.5) return 'medium';
            return 'low';
        }
        return 'low';
    };

    const demandLevel = getDemandLevel();

    const config = {
        high: {
            label: 'High Demand',
            shortLabel: 'High',
            icon: '🔥',
            description: 'Filling fast — book now!',
        },
        medium: {
            label: 'Moderate Demand',
            shortLabel: 'Medium',
            icon: '⚡',
            description: 'Seats filling up gradually',
        },
        low: {
            label: 'Low Demand',
            shortLabel: 'Low',
            icon: '✅',
            description: 'Plenty of seats available',
        },
    };

    const { label, shortLabel, icon, description } = config[demandLevel] || config.low;

    if (compact) {
        return (
            <span className={`${styles.compactBadge} ${styles[demandLevel]}`} title={description}>
                <span className={styles.compactDot} />
                {shortLabel}
            </span>
        );
    }

    return (
        <div className={`${styles.indicator} ${styles[demandLevel]}`}>
            <div className={styles.iconWrap}>
                <span className={styles.icon}>{icon}</span>
                <span className={styles.pulseRing} />
            </div>
            <div className={styles.info}>
                <span className={styles.label}>{label}</span>
                <span className={styles.description}>{description}</span>
            </div>
            {availableSeats != null && (
                <div className={styles.seatCount}>
                    <span className={styles.seatNumber}>{availableSeats}</span>
                    <span className={styles.seatLabel}>seats left</span>
                </div>
            )}
        </div>
    );
};

export default DemandIndicator;
