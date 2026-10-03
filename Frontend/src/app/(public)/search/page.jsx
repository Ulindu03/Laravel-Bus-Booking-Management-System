'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { bookingService } from '@/app/api/bookingService';
import DemandIndicator from '@/components/booking/DemandIndicator';
import styles from './search.module.css';

const SearchResultsContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');

    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSchedules = async () => {
            if (!origin || !destination || !date) {
                setError('Missing search parameters. Please try again from the homepage.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await bookingService.searchSchedules(origin, destination, date);
                if (response.success) {
                    setSchedules(response.data);
                } else {
                    setError('Failed to fetch schedules.');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred while searching for buses.');
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, [origin, destination, date]);

    // Real-time polling — refresh search results every 30 seconds
    useEffect(() => {
        if (!origin || !destination || !date || schedules.length === 0) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await bookingService.searchSchedules(origin, destination, date);
                if (response.success) {
                    setSchedules(response.data);
                }
            } catch (err) {
                // Silent fail
            }
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [origin, destination, date, schedules.length > 0]);

    if (loading) return (
        <main className={styles.searchPage}>
            <div className={styles.header}>
                <h1>Search Results</h1>
                <p>{origin} ➔ {destination} | {date && new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className={styles.scheduleList}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.skeletonCard}>
                        <div className={styles.skeletonLine} style={{ width: '40%', height: '20px' }} />
                        <div className={styles.skeletonLine} style={{ width: '25%', height: '14px', marginTop: '8px' }} />
                        <div className={styles.skeletonRow}>
                            <div className={styles.skeletonLine} style={{ width: '60px', height: '28px' }} />
                            <div className={styles.skeletonLine} style={{ width: '100px', height: '2px', marginTop: '14px' }} />
                            <div className={styles.skeletonLine} style={{ width: '60px', height: '28px' }} />
                        </div>
                        <div className={styles.skeletonRow} style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                            <div className={styles.skeletonLine} style={{ width: '80px', height: '24px' }} />
                            <div className={styles.skeletonLine} style={{ width: '110px', height: '40px', borderRadius: '12px' }} />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
    
    if (error) return (
        <div className={styles.errorContainer}>
            <p>{error}</p>
            <button onClick={() => router.push('/')} className={styles.backBtn}>Back to Home</button>
        </div>
    );

    return (
        <main className={styles.searchPage}>
            <div className={styles.header}>
                <h1>Search Results</h1>
                <p>{origin} ➔ {destination} | {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>

            <div className={styles.resultsContainer}>
                {schedules.length === 0 ? (
                    <div className={styles.noResults}>
                        <div className={styles.noResultsIcon}>🚌</div>
                        <h2>No buses found</h2>
                        <p>We couldn't find any scheduled buses for this route on the selected date.</p>
                        <button onClick={() => router.push('/')} className={styles.backBtn}>Try Another Date</button>
                    </div>
                ) : (
                    <div className={styles.scheduleList}>
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className={styles.scheduleCard}>
                                <div className={styles.busInfo}>
                                    <h3>{schedule.bus.name}</h3>
                                    <span className={styles.busType}>{schedule.bus.type.replace('_', ' ')}</span>
                                    <p className={styles.busNumber}>Reg: {schedule.bus.bus_number}</p>
                                </div>
                                <div className={styles.timeInfo}>
                                    <div className={styles.timeBlock}>
                                        <span className={styles.time}>{new Date(schedule.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span className={styles.city}>{origin}</span>
                                    </div>
                                    <div className={styles.durationLine}>
                                        <div className={styles.line}></div>
                                        <span className={styles.durationText}>
                                            {schedule.route.duration_mins} mins
                                        </span>
                                    </div>
                                    <div className={styles.timeBlock}>
                                        <span className={styles.time}>{new Date(schedule.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span className={styles.city}>{destination}</span>
                                    </div>
                                </div>
                                <div className={styles.priceBook}>
                                    {/* Smart Demand Indicator — AI-powered demand prediction */}
                                    {schedule.demand_level && (
                                        <DemandIndicator
                                            level={schedule.demand_level}
                                            predictedDemand={schedule.predicted_demand}
                                            availableSeats={schedule.available_seats}
                                            totalSeats={schedule.bus?.total_seats}
                                            compact
                                        />
                                    )}
                                    <div className={styles.priceBlock}>
                                        <span className={styles.price}>Rs. {parseFloat(schedule.calculated_fare ?? schedule.price_per_seat).toFixed(2)}</span>
                                        <span className={styles.seatsAvailable}>{schedule.available_seats} seats available</span>
                                    </div>
                                    <button 
                                        className={styles.bookBtn}
                                        onClick={() => router.push(`/book/${schedule.id}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`)}
                                        disabled={schedule.available_seats === 0}
                                    >
                                        {schedule.available_seats === 0 ? 'Sold Out' : 'Select Seats'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default function SearchResultsPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>}>
            <SearchResultsContent />
        </Suspense>
    );
}
