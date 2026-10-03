'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { bookingService } from '@/app/api/bookingService';
import SmartSeatMap from '@/components/booking/SmartSeatMap';
import styles from './book.module.css';

function BookScheduleContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const scheduleId = params.scheduleId;

    // Read segment from URL (passed from search page)
    const urlOrigin = searchParams.get('origin');
    const urlDestination = searchParams.get('destination');

    const { user, loading: authLoading } = useAuth();

    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedSeats, setSelectedSeats] = useState([]);
    const [passengerDetails, setPassengerDetails] = useState({});
    const [segmentInfo, setSegmentInfo] = useState({ boardingStop: '', alightingStop: '', segmentCount: 1 });

    const [submitting, setSubmitting] = useState(false);
    const [contactEmail, setContactEmail] = useState('');
    const [successModalData, setSuccessModalData] = useState(null);
    const [formError, setFormError] = useState('');

    // No auth redirect on page load — anyone can view seats
    // Auth is checked only when confirming the booking

    // Restore pending booking from sessionStorage after login redirect
    useEffect(() => {
        if (user && scheduleId && typeof window !== 'undefined') {
            const pendingRaw = sessionStorage.getItem('pendingBooking');
            if (pendingRaw) {
                try {
                    const pending = JSON.parse(pendingRaw);
                    if (pending.scheduleId === scheduleId) {
                        setSelectedSeats(pending.selectedSeats || []);
                        setPassengerDetails(pending.passengerDetails || {});
                        if (pending.segmentInfo) {
                            setSegmentInfo(pending.segmentInfo);
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
                sessionStorage.removeItem('pendingBooking');
            }
        }
    }, [user, scheduleId]);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await bookingService.getSchedule(scheduleId);
                if (res.success) {
                    setSchedule(res.data);

                    // Set initial segment from URL params
                    const stops = res.data.full_stops || [];
                    const routeOrigin = res.data.route?.origin;
                    const routeDest = res.data.route?.destination;

                    const initialBoarding = urlOrigin && stops.some(s => s.toLowerCase() === urlOrigin.toLowerCase())
                        ? urlOrigin : routeOrigin;
                    const initialAlighting = urlDestination && stops.some(s => s.toLowerCase() === urlDestination.toLowerCase())
                        ? urlDestination : routeDest;

                    setSegmentInfo(prev => ({
                        ...prev,
                        boardingStop: initialBoarding || '',
                        alightingStop: initialAlighting || '',
                    }));
                } else {
                    setError('Failed to load schedule details.');
                }
            } catch (err) {
                setError('Schedule not found or an error occurred.');
            } finally {
                setLoading(false);
            }
        };

        if (scheduleId) {
            fetchSchedule();
        }
    }, [scheduleId, urlOrigin, urlDestination]);

    // Real-time polling — refresh seat data every 10 seconds
    useEffect(() => {
        if (!scheduleId || !schedule) return;

        const pollInterval = setInterval(async () => {
            try {
                const res = await bookingService.getSchedule(scheduleId);
                if (res.success) {
                    // Update bookings, available seats, and full_stops
                    setSchedule(prev => ({
                        ...prev,
                        bookings: res.data.bookings,
                        available_seats: res.data.available_seats,
                        full_stops: res.data.full_stops || prev.full_stops,
                    }));
                }
            } catch (err) {
                // Silent fail — don't break UI for polling errors
            }
        }, 10000); // every 10 seconds

        return () => clearInterval(pollInterval);
    }, [scheduleId, schedule?.id]);

    const handleSeatToggle = (seatNum, segData) => {
        // Clear previous errors when user interacts
        setFormError('');

        // Update segment info from SmartSeatMap
        if (segData) {
            setSegmentInfo(segData);
        }

        // If seatNum is null, this is just a segment change notification (no seat toggle)
        if (!seatNum) return;

        if (selectedSeats.includes(seatNum)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
            const newDetails = { ...passengerDetails };
            delete newDetails[seatNum];
            setPassengerDetails(newDetails);
        } else {
            setSelectedSeats([...selectedSeats, seatNum]);
            setPassengerDetails({
                ...passengerDetails,
                [seatNum]: { name: '', phone: '' }
            });
        }
    };

    const handlePassengerChange = (seatNum, field, value) => {
        setFormError('');
        setPassengerDetails({
            ...passengerDetails,
            [seatNum]: { ...passengerDetails[seatNum], [field]: value }
        });
    };

    const handleSubmitBooking = async () => {
        setFormError('');

        if (selectedSeats.length === 0) return;

        // Validate email
        if (!contactEmail?.trim()) {
            setFormError('Please provide an email address to receive your confirmation.');
            return;
        }

        // Validate all names are filled
        for (const seat of selectedSeats) {
            if (!passengerDetails[seat]?.name?.trim()) {
                setFormError(`Please enter passenger name for seat ${seat}.`);
                return;
            }
        }

        const seatsPayload = selectedSeats.map(seat => ({
            seat_number: seat,
            passenger_name: passengerDetails[seat].name,
            passenger_phone: passengerDetails[seat].phone || null,
        }));

        // Include segment booking info (boarding/alighting stops)
        const boardingStop = segmentInfo.boardingStop || schedule.route.origin;
        const alightingStop = segmentInfo.alightingStop || schedule.route.destination;

        const email = contactEmail.trim();

        try {
            setSubmitting(true);
            const res = await bookingService.createBooking(
                schedule.id, seatsPayload, boardingStop, alightingStop, email
            );
            if (res.success) {
                const bookingRef = res.data?.booking_ref || 'CONFIRMED';
                setSuccessModalData({
                    bookingRef,
                    email,
                    seats: selectedSeats,
                    boardingStop,
                    alightingStop,
                    totalAmount,
                });
            } else {
                setFormError(res.message || 'Booking failed. Please try again.');
            }
        } catch (err) {
            setFormError(err.response?.data?.message || err.message || 'An error occurred during booking.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || authLoading) return <div className={styles.loading}>Loading booking details...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!schedule) return null;

    // =====================================================================
    // SEGMENT-AWARE SEAT AVAILABILITY
    // A seat is only "booked" if its booking OVERLAPS with the user's segment
    // =====================================================================
    const fullStops = schedule.full_stops || [];
    const boardingStop = segmentInfo.boardingStop || schedule.route?.origin;
    const alightingStop = segmentInfo.alightingStop || schedule.route?.destination;

    const getStopIndex = (stopName) => {
        if (!stopName) return -1;
        return fullStops.findIndex(s => s.toLowerCase() === stopName.toLowerCase());
    };

    const userBoardIdx = getStopIndex(boardingStop);
    const userAlightIdx = getStopIndex(alightingStop);

    // Build segment-aware booked seats list
    const bookedSeats = [];
    if (schedule.bookings && fullStops.length >= 2) {
        schedule.bookings.forEach(booking => {
            if (booking.status === 'cancelled') return;
            booking.booked_seats?.forEach(bs => {
                // If seat has segment info, check for overlap with user's segment
                if (bs.boarding_stop && bs.alighting_stop) {
                    const seatBoardIdx = getStopIndex(bs.boarding_stop);
                    const seatAlightIdx = getStopIndex(bs.alighting_stop);

                    // Overlap check: two segments [A,B) and [C,D) overlap if A < D && C < B
                    if (seatBoardIdx !== -1 && seatAlightIdx !== -1
                        && userBoardIdx !== -1 && userAlightIdx !== -1) {
                        const overlaps = seatBoardIdx < userAlightIdx && userBoardIdx < seatAlightIdx;
                        if (overlaps) {
                            bookedSeats.push(bs.seat_number);
                        }
                        // No overlap = seat is FREE for this segment!
                    } else {
                        // Can't determine segments — treat as booked (safe fallback)
                        bookedSeats.push(bs.seat_number);
                    }
                } else {
                    // Legacy whole-journey booking — always occupied
                    bookedSeats.push(bs.seat_number);
                }
            });
        });
    }

    // Calculate fare — use segment-aware pricing if available
    const route = schedule.route;
    const fareMatrix = route?.fare_matrix || {};
    const matrixKey = `${boardingStop}-${alightingStop}`;
    const pricePerSeat = fareMatrix[matrixKey]
        ? parseFloat(fareMatrix[matrixKey])
        : parseFloat(schedule.price_per_seat);
    const totalAmount = selectedSeats.length * pricePerSeat;

    // Is this a segment booking (not the full journey)?
    const isSegmentBooking = boardingStop !== route?.origin || alightingStop !== route?.destination;

    return (
        <main className={styles.bookPage}>

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Complete Your Booking</h1>
                    <div className={styles.tripDetails}>
                        <div className={styles.route}>
                            <span className={styles.city}>{boardingStop}</span>
                            <span className={styles.arrow}>➔</span>
                            <span className={styles.city}>{alightingStop}</span>
                        </div>
                        <div className={styles.meta}>
                            <span>🚌 {schedule.bus.name} ({schedule.bus.type.replace('_', ' ')})</span>
                            <span>🕒 {new Date(schedule.departure_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            <span>💵 Rs. {pricePerSeat.toFixed(2)} / seat</span>
                        </div>
                        {isSegmentBooking && (
                            <div className={styles.segmentBadge}>
                                🧩 Segment Booking — {boardingStop} to {alightingStop}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.layout}>
                    {/* Left: Seat Map */}
                    <div className={styles.seatSelection}>
                        <h2>Select Seats</h2>
                        <SmartSeatMap
                            scheduleId={schedule.id}
                            totalSeats={schedule.bus.total_seats}
                            layout={schedule.bus.seat_layout}
                            bookedSeats={bookedSeats}
                            selectedSeats={selectedSeats}
                            onSeatToggle={handleSeatToggle}
                            route={schedule.route}
                            schedule={schedule}
                            initialBoardingStop={boardingStop}
                            initialAlightingStop={alightingStop}
                            fullStops={fullStops}
                        />
                    </div>

                    {/* Right: Passenger Details & Summary */}
                    <div className={styles.bookingSidebar}>
                        <h2>Passenger Details</h2>

                        {successModalData ? (
                            <div className={styles.inlineSuccessCard}>
                                <div className={styles.inlineSuccessHeader}>
                                    <span></span>
                                    <span>Booking Confirmed!</span>
                                </div>
                                <p className={styles.inlineSuccessSub}>
                                    Ticket details have been reserved successfully.
                                </p>

                                <div className={styles.refPill}>
                                    <span className={styles.refLabel}>Booking Ref</span>
                                    <span className={styles.refCode}>{successModalData.bookingRef}</span>
                                </div>

                                <div className={styles.ticketSummaryGrid}>
                                    <div className={styles.ticketRow}>
                                        <span className={styles.ticketRowLabel}>Route Segment</span>
                                        <span className={styles.ticketRowValue}>{successModalData.boardingStop} ➔ {successModalData.alightingStop}</span>
                                    </div>
                                    <div className={styles.ticketRow}>
                                        <span className={styles.ticketRowLabel}>Reserved Seats</span>
                                        <span className={styles.ticketRowValue}>{successModalData.seats.join(', ')}</span>
                                    </div>
                                    <div className={styles.ticketRow}>
                                        <span className={styles.ticketRowLabel}>Total Paid</span>
                                        <span className={styles.ticketRowValue} style={{ color: '#34d399' }}>Rs. {successModalData.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className={styles.ticketRow}>
                                        <span className={styles.ticketRowLabel}>Email Sent To</span>
                                        <span className={`${styles.ticketRowValue} ${styles.emailHighlight}`}>✉️ {successModalData.email}</span>
                                    </div>
                                </div>

                                <div className={styles.modalActionBtns} style={{ flexDirection: 'column', gap: '0.75rem' }}>
                                    <button
                                        className={styles.modalPrimaryBtn}
                                        onClick={() => {
                                            setSuccessModalData(null);
                                            setSelectedSeats([]);
                                            setPassengerDetails({});
                                            setContactEmail('');
                                        }}
                                    >
                                        + Book Another Seat
                                    </button>
                                    <button
                                        className={styles.modalSecondaryBtn}
                                        onClick={() => router.push(user ? '/dashboard' : '/')}
                                    >
                                        {user ? 'View My Trips →' : 'Return to Home →'}
                                    </button>
                                </div>
                            </div>
                        ) : selectedSeats.length === 0 ? (
                            <div className={styles.emptyState}>
                                Please select at least one seat from the map to proceed.
                            </div>
                        ) : (
                            <div className={styles.passengerForms}>
                                {selectedSeats.map(seat => (
                                    <div key={seat} className={styles.passengerCard}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.seatBadge}>Seat {seat}</span>
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Full Name *</label>
                                            <input
                                                type="text"
                                                value={passengerDetails[seat]?.name || ''}
                                                onChange={(e) => handlePassengerChange(seat, 'name', e.target.value)}
                                                placeholder="Enter passenger name"
                                                required
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Phone (Optional)</label>
                                            <input
                                                type="tel"
                                                value={passengerDetails[seat]?.phone || ''}
                                                onChange={(e) => handlePassengerChange(seat, 'phone', e.target.value)}
                                                placeholder="Contact number"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className={styles.summaryCard}>
                                    <h3>Booking Summary</h3>
                                    {isSegmentBooking && (
                                        <div className={styles.summaryRow}>
                                            <span>Segment:</span>
                                            <span>{boardingStop} → {alightingStop}</span>
                                        </div>
                                    )}
                                    <div className={styles.summaryRow}>
                                        <span>Selected Seats:</span>
                                        <span>{selectedSeats.join(', ')}</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Price per Seat:</span>
                                        <span>Rs. {pricePerSeat.toFixed(2)}</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Total Amount:</span>
                                        <span className={styles.totalPrice}>Rs. {totalAmount.toFixed(2)}</span>
                                    </div>

                                    {/* Email field — required for all bookings */}
                                    <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
                                        <label>Email for Confirmation *</label>
                                        <input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>

                                    {/* Inline Form Error Banner */}
                                    {formError && (
                                        <div className={styles.formErrorBanner}>
                                            <span>⚠️</span> {formError}
                                        </div>
                                    )}

                                    <button
                                        className={styles.submitBtn}
                                        onClick={handleSubmitBooking}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Processing...' : 'Confirm Booking'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function BookSchedulePage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Loading...</div>}>
            <BookScheduleContent />
        </Suspense>
    );
}
