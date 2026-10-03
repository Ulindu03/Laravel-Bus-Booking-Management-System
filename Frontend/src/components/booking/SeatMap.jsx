import React from 'react';
import styles from './SeatMap.module.css';

const SeatMap = ({ totalSeats, layout = '2x2', bookedSeats = [], selectedSeats = [], onSeatToggle }) => {
    // Parse layout, e.g., '2x2' -> left: 2, right: 2
    const [leftCols, rightCols] = layout.split('x').map(Number);
    const seatsPerRow = leftCols + rightCols;
    const numRows = Math.ceil(totalSeats / seatsPerRow);

    const getSeatNumber = (rowIndex, colIndex) => {
        const rowChar = String.fromCharCode(65 + rowIndex); // A, B, C...
        return `${rowChar}${colIndex + 1}`;
    };

    const isBooked = (seatNumber) => bookedSeats.includes(seatNumber);
    const isSelected = (seatNumber) => selectedSeats.includes(seatNumber);

    // Generate grid
    const rows = [];
    for (let r = 0; r < numRows; r++) {
        const rowSeats = [];
        
        // Left side seats
        for (let c = 0; c < leftCols; c++) {
            const seatNum = getSeatNumber(r, c);
            rowSeats.push(seatNum);
        }
        
        // Aisle (null)
        rowSeats.push(null);
        
        // Right side seats
        for (let c = 0; c < rightCols; c++) {
            const seatNum = getSeatNumber(r, leftCols + c);
            rowSeats.push(seatNum);
        }
        
        rows.push(rowSeats);
    }

    return (
        <div className={styles.seatMapContainer}>
            <div className={styles.steeringWheel}>
                <span>Driver</span>
            </div>
            
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={`${styles.seatBox} ${styles.available}`}></div>
                    <span>Available</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.seatBox} ${styles.selected}`}></div>
                    <span>Selected</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.seatBox} ${styles.booked}`}></div>
                    <span>Booked</span>
                </div>
            </div>

            <div className={styles.grid}>
                {rows.map((row, rIndex) => (
                    <div key={`row-${rIndex}`} className={styles.row}>
                        {row.map((seatNum, cIndex) => {
                            if (seatNum === null) {
                                return <div key={`aisle-${rIndex}-${cIndex}`} className={styles.aisle}></div>;
                            }

                            // If we exceed total seats (due to Math.ceil), render empty spaces
                            const seatIndex = (rIndex * seatsPerRow) + (cIndex > leftCols ? cIndex - 1 : cIndex);
                            if (seatIndex >= totalSeats) {
                                return <div key={`empty-${rIndex}-${cIndex}`} className={styles.emptySpace}></div>;
                            }

                            return (
                                <button
                                    key={seatNum}
                                    type="button"
                                    onClick={() => !isBooked(seatNum) && onSeatToggle(seatNum)}
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
        </div>
    );
};

export default SeatMap;
