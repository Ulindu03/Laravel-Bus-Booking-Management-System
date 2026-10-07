'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CalendarDatePicker from '@/components/ui/CalendarDatePicker';
import styles from './SearchBooking.module.css';

const sriLankaRoutes = [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Matara',
    'Negombo', 'Anuradhapura', 'Trincomalee', 'Badulla',
    'Nuwara Eliya', 'Kurunegala', 'Ratnapura', 'Batticaloa',
    'Hambantota', 'Dambulla', 'Chilaw', 'Kalutara', 'Kegalle'
];

const SearchableSelect = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className={styles.searchableSelect} ref={wrapperRef}>
            <div 
                className={`${styles.selectTrigger} ${isOpen ? styles.isOpen : ''}`} 
                onClick={() => {
                    setIsOpen(!isOpen);
                    setSearch(''); // Reset search on open
                }}
            >
                {value || <span className={styles.placeholder}>{placeholder}</span>}
                <span className={styles.chevron}>▼</span>
            </div>
            
            {isOpen && (
                <div className={styles.selectDropdown}>
                    <input 
                        type="text" 
                        className={styles.searchInput} 
                        placeholder="Search..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                    <ul className={styles.optionsList}>
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                            <li 
                                key={opt} 
                                className={`${styles.optionItem} ${value === opt ? styles.selected : ''}`}
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                            >
                                {opt}
                            </li>
                        )) : (
                            <li className={styles.noResults}>No matches found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

const SearchBooking = () => {
    const router = useRouter();
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const today = new Date();
    const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const handleSearch = (e) => {
        e.preventDefault();
        if (!origin || !destination || !date) return alert('Please fill all fields');
        const searchParams = new URLSearchParams({ origin, destination, date });
        router.push(`/search?${searchParams.toString()}`);
    };

    return (
        <section className={styles.searchSection} id="search-booking">
            {/* Background Image */}
            <div className={styles.sectionBg}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/search-bg.png" alt="" aria-hidden="true" />
            </div>
            <div className={styles.sectionOverlay} />
            <div className={styles.searchInner}>
                <p className={styles.sectionLabel}>Quick Booking</p>
                <h2 className={styles.sectionHeading}>Find Your Perfect Route</h2>

                <div className={styles.searchCard}>
                    <form className={styles.searchForm} onSubmit={handleSearch}>
                        <div className={styles.formGroup}>
                            <label>From</label>
                            <SearchableSelect 
                                value={origin} 
                                onChange={setOrigin} 
                                options={sriLankaRoutes} 
                                placeholder="Select departure" 
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>To</label>
                            <SearchableSelect 
                                value={destination} 
                                onChange={setDestination} 
                                options={sriLankaRoutes} 
                                placeholder="Select destination" 
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="travel-date">Date</label>
                            <CalendarDatePicker id="travel-date" label="Travel date" value={date} onChange={setDate} min={minimumDate} />
                        </div>

                        <button type="submit" className={styles.searchBtn}>
                            🔍 Search Buses
                        </button>
                    </form>

                    <div className={styles.trustBar}>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>🔒</span>
                            Secure Payments
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>⚡</span>
                            Instant Confirmation
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>💳</span>
                            All Major Cards Accepted
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>🔄</span>
                            Free Cancellation
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SearchBooking;
