'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './StatsCard.module.css';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const StatsCard = ({ icon, label, value, trend, trendValue, gradient = 'cyan', subtitle }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    // Reset animation flag when value changes so it re-animates with new data
    animated.current = false;
  }, [value]);

  useEffect(() => {
    if (animated.current) return;

    const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
    if (numValue === 0) {
      setDisplayValue(value);
      return;
    }

    animated.current = true;
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;
    const increment = numValue / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(numValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const gradientClasses = {
    cyan: styles.gradientCyan,
    purple: styles.gradientPurple,
    green: styles.gradientGreen,
    orange: styles.gradientOrange,
    pink: styles.gradientPink,
    blue: styles.gradientBlue,
  };

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={`${styles.iconWrap} ${gradientClasses[gradient] || gradientClasses.cyan}`}>
        <div className={styles.iconGlow} />
        <span className={styles.icon}>{icon}</span>
      </div>

      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <div className={styles.valueRow}>
          <span className={styles.value}>
            {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
          </span>
          {trend && (
            <div className={`${styles.trend} ${trend === 'up' ? styles.trendUp : styles.trendDown}`}>
              {trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>

      <div className={`${styles.bgGlow} ${gradientClasses[gradient] || gradientClasses.cyan}`} />
    </div>
  );
};

export default StatsCard;
