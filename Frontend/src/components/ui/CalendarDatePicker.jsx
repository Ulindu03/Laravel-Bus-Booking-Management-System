'use client';

import { useEffect, useRef, useState } from 'react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import styles from './CalendarDatePicker.module.css';

const toDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const fromDateKey = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

const CalendarDatePicker = ({ id, value, onChange, min, label, placeholder = 'Select a date' }) => {
  const todayKey = toDateKey(new Date());
  const selectedDate = fromDateKey(value);
  const minimumDate = fromDateKey(min);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = selectedDate || minimumDate || new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) return null;
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    return { date, key: toDateKey(date), day };
  });
  const activeDate = days.find((date) => date?.key === value && (!min || date.key >= min))
    || days.find((date) => date?.key === todayKey && (!min || todayKey >= min))
    || days.find((date) => date && (!min || date.key >= min));
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(visibleMonth);
  const formattedValue = selectedDate
    ? new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate)
    : placeholder;
  const minimumMonth = minimumDate ? minimumDate.getFullYear() * 12 + minimumDate.getMonth() : null;
  const currentMonth = visibleMonth.getFullYear() * 12 + visibleMonth.getMonth();

  const togglePicker = () => {
    if (!isOpen) {
      const initialDate = selectedDate || minimumDate || new Date();
      setVisibleMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    }
    setIsOpen(!isOpen);
  };

  const handleDayKeyDown = (event, date) => {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let offset = offsets[event.key];
    if (event.key === 'Home') offset = -date.date.getDay();
    if (event.key === 'End') offset = 6 - date.date.getDay();
    if (offset === undefined) return;

    const nextDate = new Date(date.date.getFullYear(), date.date.getMonth(), date.day + offset);
    const nextDateKey = toDateKey(nextDate);
    if (min && nextDateKey < min) return;

    event.preventDefault();
    setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    requestAnimationFrame(() => document.getElementById(`${id}-day-${nextDateKey}`)?.focus());
  };

  const selectDate = (dateKey) => {
    onChange(dateKey);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={styles.picker} ref={wrapperRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${selectedDate ? '' : styles.triggerEmpty}`}
        onClick={togglePicker}
        aria-label={`${label}: ${selectedDate ? formattedValue : 'Choose a date'}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${id}-calendar`}
        aria-required="true"
      >
        <span className={styles.triggerValue}>{formattedValue}</span>
        <CalendarMonthIcon className={styles.triggerIcon} />
      </button>

      {isOpen && (
        <div className={styles.popover} id={`${id}-calendar`} role="dialog" aria-label={`${label} calendar`}>
          <div className={styles.calendarHeader}>
            <div>
              <p className={styles.eyebrow}>TRAVEL DATE</p>
              <h3>{monthLabel}</h3>
            </div>
            <div className={styles.navigation}>
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                disabled={minimumMonth !== null && currentMonth <= minimumMonth}
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className={styles.daysGrid} role="grid" aria-label={monthLabel}>
            <div className={styles.weekdays} role="row">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((weekday) => (
                <span key={weekday} role="columnheader">{weekday}</span>
              ))}
            </div>
            {Array.from({ length: 6 }, (_, week) => (
              <div className={styles.week} role="row" key={week}>
                {days.slice(week * 7, week * 7 + 7).map((date, index) => (
                  <div className={styles.dayCell} role="gridcell" key={date?.key || `blank-${week}-${index}`}>
                    {date && (
                      <button
                        id={`${id}-day-${date.key}`}
                        type="button"
                        className={`${styles.day} ${date.key === value ? styles.daySelected : ''} ${date.key === todayKey ? styles.dayToday : ''}`}
                        onClick={() => selectDate(date.key)}
                        disabled={Boolean(min && date.key < min)}
                        aria-label={new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(date.date)}
                        aria-pressed={date.key === value}
                        tabIndex={date.key === activeDate?.key ? 0 : -1}
                        onKeyDown={(event) => handleDayKeyDown(event, date)}
                      >
                        {date.day}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className={styles.calendarFooter}>
            <span>{selectedDate ? formattedValue : 'No date selected'}</span>
            <button type="button" onClick={() => selectDate(todayKey)} disabled={Boolean(min && todayKey < min)}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarDatePicker;