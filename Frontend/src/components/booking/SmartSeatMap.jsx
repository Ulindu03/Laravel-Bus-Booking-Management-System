'use client';

import React, { useState, useEffect } from 'react';
import { aiService } from '@/app/api/aiService';
import DemandIndicator from './DemandIndicator';
import styles from './SmartSeatMap.module.css';

/**
 * SmartSeatMap — AI-powered segment-aware seat selection
 * Extends the original SeatMap with:
 *   - Boarding/Alighting stop selection (segment booking)
 *   - AI demand indicators per segment
 *   - Segment-based seat availability
 */
const SmartSeatMap = ({
    scheduleId,
    totalSeats,
    layout = '2x2',
    bookedSeats = [],
    selectedSeats = [],
    onSeatToggle,
    route,
    schedule,
    initialBoardingStop = '',
    initialAlightingStop = '',
    fullStops: fullStopsProp = null,
}) => {
    const [segments, setSegments] = useState(null);
    const [segmentsLoading, setSegmentsLoading] = useState(false);
    const [boardingStop, setBoardingStop] = useState(initialBoardingStop);
    const [alightingStop, setAlightingStop] = useState(initialAlightingStop);
    const [segmentDemand, setSegmentDemand] = useState(null);

    // Route stops — use normalized fullStops prop, fallback to extracting from route
    const stops = (() => {
        if (fullStopsProp && fullStopsProp.length >= 2) return fullStopsProp;
        // Extract stop names from route.stops (handles both object and string formats)
        const rawStops = route?.stops || [];
        const names = rawStops.map(s => (typeof s === 'object' && s?.name) ? s.name : s).filter(Boolean);
        if (names.length >= 2) {
            // Check if origin/destination are already included
            const first = names[0]?.toLowerCase();
            const last = names[names.length - 1]?.toLowerCase();
            if (first === route?.origin?.toLowerCase() && last === route?.destination?.toLowerCase()) {
                return names;
            }
            // Build full sequence
            const seq = [route?.origin, ...names.filter(n => 
                n.toLowerCase() !== route?.origin?.toLowerCase() && 
                n.toLowerCase() !== route?.destination?.toLowerCase()
            ), route?.destination].filter(Boolean);
            return seq;
        }
        return [route?.origin, route?.destination].filter(Boolean);
    })();
    const hasIntermediateStops = stops.length > 2;

    // Fetch AI segment data when schedule is available
    useEffect(() => {
        if (!scheduleId || !hasIntermediateStops) return;

        const fetchSegments = async () => {
            setSegmentsLoading(true);
            try {
                const res = await aiService.getSegmentAvailability(scheduleId);
                if (res.success) {
                    setSegments(res.data.segments);
                }
            } catch (err) {
                // AI segments unavailable — fallback to normal mode
                console.warn('Segment data unavailable, using standard mode');
            } finally {
                setSegmentsLoading(false);
            }
        };

        fetchSegments();
    }, [scheduleId]);

    // Set default stops from props or fallback
    useEffect(() => {
        if (stops.length >= 2) {
            if (!boardingStop) setBoardingStop(initialBoardingStop || stops[0]);
            if (!alightingStop) setAlightingStop(initialAlightingStop || stops[stops.length - 1]);
        }
    }, [stops, initialBoardingStop, initialAlightingStop]);

    // Update demand based on selected segment
    useEffect(() => {
        if (!segments || !boardingStop || !alightingStop) return;

        const boardIdx = stops.indexOf(boardingStop);
        const alightIdx = stops.indexOf(alightingStop);

        if (boardIdx >= 0 && alightIdx > boardIdx) {
            // Get demand for segments between boarding and alighting
            const relevantSegments = segments.filter(
                s => s.segment_index >= boardIdx && s.segment_index < alightIdx
            );

            if (relevantSegments.length > 0) {
                // Use the highest demand level among segments
                const worstDemand = relevantSegments.reduce((worst, seg) => {
                    const levels = { high: 3, medium: 2, low: 1 };
                    return (levels[seg.demand_level] || 0) > (levels[worst.demand_level] || 0) ? seg : worst;
                }, relevantSegments[0]);

                const totalAvailable = Math.min(...relevantSegments.map(s => s.available_seats));

                setSegmentDemand({
                    level: worstDemand.demand_level,
                    availableSeats: totalAvailable,
                    totalSeats: worstDemand.total_seats,
                    segments: relevantSegments,
                });
            }
        }
    }, [segments, boardingStop, alightingStop]);

    // Parse layout
    const [leftCols, rightCols] = layout.split('x').map(Number);
    const seatsPerRow = leftCols + rightCols;
    const numRows = Math.ceil(totalSeats / seatsPerRow);

    const getSeatNumber = (rowIndex, colIndex) => {
        const rowChar = String.fromCharCode(65 + rowIndex);
        return `${rowChar}${colIndex + 1}`;
    };

    const isBooked = (seatNumber) => bookedSeats.includes(seatNumber);
    const isSelected = (seatNumber) => selectedSeats.includes(seatNumber);

    // Generate seat grid
    const rows = [];
    for (let r = 0; r < numRows; r++) {
        const rowSeats = [];
        for (let c = 0; c < leftCols; c++) {
            rowSeats.push(getSeatNumber(r, c));
        }
        rowSeats.push(null); // Aisle
        for (let c = 0; c < rightCols; c++) {
            rowSeats.push(getSeatNumber(r, leftCols + c));
        }
        rows.push(rowSeats);
    }

    // Get valid alighting stops based on boarding stop
    const getValidAlightingStops = () => {
        const boardIdx = stops.indexOf(boardingStop);
        return stops.filter((_, idx) => idx > boardIdx);
    };

    // Segment count for fare calculation
    const getSegmentCount = () => {
        const boardIdx = stops.indexOf(boardingStop);
        const alightIdx = stops.indexOf(alightingStop);
        return alightIdx - boardIdx;
    };

    // Notify parent whenever segment selection changes (so bookedSeats recalculates)
    useEffect(() => {
        if (boardingStop && alightingStop && onSeatToggle) {
            // Pass null as seatNum to indicate "segment changed, no seat toggled"
            // Parent will update segmentInfo but not toggle any seat
            onSeatToggle(null, {
                boardingStop,
                alightingStop,
                segmentCount: getSegmentCount(),
            });
        }
    }, [boardingStop, alightingStop]);

    // Pass segment info to parent when a seat is toggled
    const handleSeatToggleWithSegment = (seatNum) => {
        if (onSeatToggle) {
            onSeatToggle(seatNum, {
                boardingStop,
                alightingStop,
                segmentCount: getSegmentCount(),
            });
        }
    };

    return (
        <div className={styles.smartSeatMap}>
            {/* Segment Selector — only show if route has intermediate stops */}
            {hasIntermediateStops && (
                <div className={styles.segmentSelector}>
                    <h3 className={styles.sectionTitle}>
                        <span className={styles.aiIcon}>🧠</span>
                        Select Your Journey Segment
                    </h3>
                    <p className={styles.sectionHint}>
                        You can book for part of the route — choose your boarding and alighting stops
                    </p>

                    <div className={styles.stopSelectors}>
                        <div className={styles.stopField}>
                            <label className={styles.stopLabel}>Boarding At</label>
                            <select
                                value={boardingStop}
                                onChange={(e) => {
                                    setBoardingStop(e.target.value);
                                    // Reset alighting if it's before new boarding
                                    const newBoardIdx = stops.indexOf(e.target.value);
                                    const alightIdx = stops.indexOf(alightingStop);
                                    if (alightIdx <= newBoardIdx) {
                                        setAlightingStop(stops[newBoardIdx + 1] || stops[stops.length - 1]);
                                    }
                                }}
                                className={styles.stopSelect}
                            >
                                {stops.slice(0, -1).map((stop, idx) => (
                                    <option key={`board-${idx}`} value={stop}>{stop}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.arrowIcon}>→</div>

                        <div className={styles.stopField}>
                            <label className={styles.stopLabel}>Alighting At</label>
                            <select
                                value={alightingStop}
                                onChange={(e) => setAlightingStop(e.target.value)}
                                className={styles.stopSelect}
                            >
                                {getValidAlightingStops().map((stop, idx) => (
                                    <option key={`alight-${idx}`} value={stop}>{stop}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Segment Route Visualization */}
                    <div className={styles.routeViz}>
                        {stops.map((stop, idx) => {
                            const boardIdx = stops.indexOf(boardingStop);
                            const alightIdx = stops.indexOf(alightingStop);
                            const isActive = idx >= boardIdx && idx <= alightIdx;
                            const isEndpoint = stop === boardingStop || stop === alightingStop;
                            const segment = segments?.find(s => s.segment_index === idx);

                            return (
                                <React.Fragment key={`viz-${idx}`}>
                                    <div className={`${styles.vizStop} ${isActive ? styles.vizActive : ''} ${isEndpoint ? styles.vizEndpoint : ''}`}>
                                        <div className={styles.vizDot} />
                                        <span className={styles.vizName}>{stop}</span>
                                    </div>
                                    {idx < stops.length - 1 && (
                                        <div className={`${styles.vizLine} ${(idx >= boardIdx && idx < alightIdx) ? styles.vizLineActive : ''}`}>
                                            {segment && isActive && idx < alightIdx && (
                                                <DemandIndicator level={segment.demand_level} compact />
                                            )}
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Demand Indicator */}
            {segmentDemand && (
                <DemandIndicator
                    level={segmentDemand.level}
                    availableSeats={segmentDemand.availableSeats}
                    totalSeats={segmentDemand.totalSeats}
                />
            )}

            {/* Seat Map */}
            <div className={styles.seatMapContainer}>
                <div className={styles.steeringWheel}>
                    <span>Driver</span>
                </div>

                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <div className={`${styles.seatBox} ${styles.available}`} />
                        <span>Available</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.seatBox} ${styles.selected}`} />
                        <span>Selected</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.seatBox} ${styles.booked}`} />
                        <span>Booked</span>
                    </div>
                </div>

                <div className={styles.grid}>
                    {rows.map((row, rIndex) => (
                        <div key={`row-${rIndex}`} className={styles.row}>
                            {row.map((seatNum, cIndex) => {
                                if (seatNum === null) {
                                    return <div key={`aisle-${rIndex}-${cIndex}`} className={styles.aisle} />;
                                }

                                const seatIndex = (rIndex * seatsPerRow) + (cIndex > leftCols ? cIndex - 1 : cIndex);
                                if (seatIndex >= totalSeats) {
                                    return <div key={`empty-${rIndex}-${cIndex}`} className={styles.emptySpace} />;
                                }

                                return (
                                    <button
                                        key={seatNum}
                                        type="button"
                                        onClick={() => !isBooked(seatNum) && handleSeatToggleWithSegment(seatNum)}
                                        disabled={isBooked(seatNum)}
                                        className={`
                                            ${styles.seatBtn}
                                            ${isBooked(seatNum) ? styles.booked : ''}
                                            ${isSelected(seatNum) ? styles.selected : ''}
                                            ${!isBooked(seatNum) && !isSelected(seatNum) ? styles.available : ''}
                                        `}
                                        title={seatNum}
                                    >
                                        {seatNum}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {segmentsLoading && (
                    <div className={styles.segmentLoading}>
                        <span className={styles.loadingSpinner} />
                        Loading AI seat analysis...
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartSeatMap;
