'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './PopularRoutes.module.css';

const routes = [
    { from: 'Colombo', to: 'Kandy', emoji: '🏔️', duration: '3h 30m', distance: '116 km', price: 'Rs. 450' },
    { from: 'Colombo', to: 'Galle', emoji: '🏖️', duration: '2h 45m', distance: '126 km', price: 'Rs. 400' },
    { from: 'Colombo', to: 'Jaffna', emoji: '🛕', duration: '7h 00m', distance: '398 km', price: 'Rs. 1,200' },
    { from: 'Kandy', to: 'Nuwara Eliya', emoji: '🍃', duration: '2h 30m', distance: '77 km', price: 'Rs. 300' },
    { from: 'Colombo', to: 'Anuradhapura', emoji: '🏛️', duration: '4h 30m', distance: '206 km', price: 'Rs. 700' },
    { from: 'Matara', to: 'Colombo', emoji: '🌊', duration: '3h 30m', distance: '160 km', price: 'Rs. 500' },
];

const PopularRoutes = () => {
    const router = useRouter();

    const handleRouteClick = (origin, destination) => {
        // Use tomorrow's date as default since users usually book in advance
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        const searchParams = new URLSearchParams({ origin, destination, date: dateStr });
        router.push(`/search?${searchParams.toString()}`);
    };

    return (
        <section className={styles.routesSection} id="popular-routes">
            {/* Background Image */}
            <div className={styles.sectionBg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/routes-bg.png" alt="" aria-hidden="true" />
            </div>
            <div className={styles.sectionOverlay} />
            <div className={styles.routesInner}>
                <p className={styles.sectionLabel}>Popular Destinations</p>
                <h2 className={styles.sectionHeading}>Most Booked Routes</h2>
                <p className={styles.sectionDesc}>
                    Explore the most popular bus routes across the beautiful island of Sri Lanka.
                    From ancient cities to coastal gems.
                </p>

                <div className={styles.routesGrid}>
                    {routes.map((route, index) => (
                        <div 
                            key={index} 
                            className={styles.routeCard} 
                            onClick={() => handleRouteClick(route.from, route.to)}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className={styles.routePrice}>{route.price}</span>
                            <div className={styles.routeHeader}>
                                <div className={styles.routeEmoji}>{route.emoji}</div>
                                <div className={styles.routeNames}>
                                    <p className={styles.routeFrom}>{route.from}</p>
                                    <p className={styles.routeArrow}>↓</p>
                                    <p className={styles.routeTo}>{route.to}</p>
                                </div>
                            </div>
                            <div className={styles.routeDetails}>
                                <div className={styles.routeDetail}>
                                    <span className={styles.icon}>⏱️</span>
                                    {route.duration}
                                </div>
                                <div className={styles.routeDetail}>
                                    <span className={styles.icon}>📏</span>
                                    {route.distance}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PopularRoutes;

