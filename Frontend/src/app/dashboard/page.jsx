'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { bookingService } from '@/app/api/bookingService';
import styles from './dashboard.module.css';

export default function UserDashboard() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await bookingService.getMyBookings();
                if (res.success) {
                    setBookings(res.data);
                }
            } catch (err) {
                console.error("Failed to load bookings", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchBookings();
        }
    }, [user]);

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
        
        try {
            const res = await bookingService.cancelBooking(bookingId);
            if (res.success) {
                // Update local state to reflect cancellation
                setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
                alert('Booking cancelled successfully.');
            } else {
                alert(res.message || 'Failed to cancel booking');
            }
        } catch (err) {
            alert(err.message || 'An error occurred while cancelling.');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (authLoading || loading) return <div className={styles.loading}>Loading your dashboard...</div>;
    if (!user) return null;

    return (
        <main className={styles.dashboardPage}>
            <div className={styles.sidebar}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                </div>
                <nav className={styles.navMenu}>
                    <button className={`${styles.navItem} ${styles.active}`}>My Bookings</button>
                    <button className={styles.navItem} onClick={() => router.push('/')}>New Search</button>
                    <button className={styles.navItem} onClick={handleLogout}>Logout</button>
                </nav>
            </div>

            <div className={styles.mainContent}>
                <h1 className={styles.pageTitle}>My Bookings</h1>
                
                {bookings.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🎫</div>
                        <h2>No Bookings Yet</h2>
                        <p>You haven't made any bus bookings yet. Find your next destination!</p>
                        <button className={styles.searchBtn} onClick={() => router.push('/')}>Search Buses</button>
                    </div>
                ) : (
                    <div className={styles.bookingList}>
                        {bookings.map((booking) => {
                            const isUpcoming = new Date(booking.schedule.departure_time) > new Date() && booking.status !== 'cancelled';
                            
                            return (
                                <div key={booking.id} className={styles.bookingCard}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.refInfo}>
                                            <span className={styles.refLabel}>Booking Ref:</span>
                                            <span className={styles.refValue}>{booking.booking_ref}</span>
                                        </div>
                                        <span className={`${styles.statusBadge} ${styles[booking.status]}`}>
                                            {booking.status.toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <div className={styles.tripInfo}>
                                        <div className={styles.route}>
                                            <div className={styles.cityBlock}>
                                                <span className={styles.cityTime}>{new Date(booking.schedule.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                <span className={styles.cityName}>{booking.schedule.route.origin}</span>
                                                <span className={styles.cityDate}>{new Date(booking.schedule.departure_time).toLocaleDateString()}</span>
                                            </div>
                                            <div className={styles.routeArrow}>➔</div>
                                            <div className={styles.cityBlock}>
                                                <span className={styles.cityTime}>{new Date(booking.schedule.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                <span className={styles.cityName}>{booking.schedule.route.destination}</span>
                                                <span className={styles.cityDate}>{new Date(booking.schedule.arrival_time).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        
                                        <div className={styles.busDetails}>
                                            <span className={styles.busName}>🚌 {booking.schedule.bus.name}</span>
                                            <span className={styles.seats}>💺 {booking.total_seats} {booking.total_seats > 1 ? 'Seats' : 'Seat'} ({booking.booked_seats.map(s => s.seat_number).join(', ')})</span>
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.amount}>
                                            Total: Rs. {parseFloat(booking.total_amount).toFixed(2)}
                                        </div>
                                        {isUpcoming && (
                                            <button 
                                                className={styles.cancelBtn}
                                                onClick={() => handleCancel(booking.id)}
                                            >
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}