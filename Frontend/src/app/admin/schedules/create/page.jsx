'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import scheduleService from '@/app/api/scheduleService';
import busService from '@/app/api/busService';
import routeService from '@/app/api/routeService';
import CalendarDatePicker from '@/components/ui/CalendarDatePicker';
import styles from './createSchedule.module.css';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import RouteIcon from '@mui/icons-material/Route';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const minutesList = Array.from({ length: 12 }, (_, i) => i * 5);

const to24h = (h, m, ampm) => {
  let hour24 = parseInt(h);
  if (ampm === 'AM' && hour24 === 12) hour24 = 0;
  if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const parse24h = (timeStr) => {
  if (!timeStr) return { h: '', m: '', ampm: 'AM' };
  const [hh, mm] = timeStr.split(':').map(Number);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return { h: String(h), m: String(mm), ampm };
};

const CreateSchedulePage = () => {
  const router = useRouter();
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    bus_id: '', route_id: '',
    departure_date: '', departure_time: '',
    arrival_date: '', arrival_time: '',
    price_per_seat: '', available_seats: '',
    status: 'scheduled',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [busRes, routeRes] = await Promise.all([
          busService.getAllBuses(),
          routeService.getAllRoutes(),
        ]);
        setBuses(busRes.data || []);
        setRoutes(routeRes.data || []);
      } catch (err) {
        setError('Failed to load buses/routes');
      }
    };
    fetchData();
  }, []);

  const handleBusSelect = (busId) => {
    const bus = buses.find(b => b.id === parseInt(busId));
    setFormData(prev => ({
      ...prev,
      bus_id: busId,
      available_seats: bus ? bus.total_seats : prev.available_seats,
    }));
  };

  const handleRouteSelect = (routeId) => {
    const route = routes.find(r => r.id === parseInt(routeId));
    setFormData(prev => ({
      ...prev,
      route_id: routeId,
      price_per_seat: route ? route.base_fare : prev.price_per_seat,
    }));
  };

  const depParsed = parse24h(formData.departure_time);
  const arrParsed = parse24h(formData.arrival_time);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.departure_date || !formData.arrival_date || formData.arrival_date < formData.departure_date) {
      setError('Select valid departure and arrival dates');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const departure = `${formData.departure_date}T${formData.departure_time}`;
      const arrival = `${formData.arrival_date}T${formData.arrival_time}`;
      await scheduleService.createSchedule({
        bus_id: formData.bus_id,
        route_id: formData.route_id,
        departure_time: departure,
        arrival_time: arrival,
        price_per_seat: parseFloat(formData.price_per_seat),
        available_seats: parseInt(formData.available_seats),
        status: formData.status,
      });
      router.push('/admin/schedules');
    } catch (err) {
      setError(err.message || 'Failed to create schedule');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/admin/schedules" className={styles.backBtn}>
          <ArrowBackIcon /> Back to Schedules
        </Link>
        <div className={styles.headerTitle}>
          <div className={styles.headerIcon}>
            <ScheduleIcon />
          </div>
          <div>
            <h1>Create Schedule</h1>
            <p>Assign a bus to a route with date & time</p>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <span>{error}</span>
          <button onClick={() => setError('')}><CloseIcon style={{ fontSize: 16 }} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* Left Column */}
        <div className={styles.formColumn}>
          {/* Bus & Route Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <DirectionsBusIcon />
              <h2>Bus & Route</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label>Select Bus <span className={styles.required}>*</span></label>
                <select value={formData.bus_id} onChange={e => handleBusSelect(e.target.value)} required>
                  <option value="">Choose a bus...</option>
                  {buses.filter(b => b.status === 'active').map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.bus_number}) — {b.total_seats} seats</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Select Route <span className={styles.required}>*</span></label>
                <select value={formData.route_id} onChange={e => handleRouteSelect(e.target.value)} required>
                  <option value="">Choose a route...</option>
                  {routes.filter(r => r.status === 'active').map(r => (
                    <option key={r.id} value={r.id}>{r.origin} → {r.destination} ({r.name})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Seats Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <AttachMoneyIcon />
              <h2>Pricing & Seats</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price per Seat (LKR) <span className={styles.required}>*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_per_seat}
                    onChange={e => setFormData({ ...formData, price_per_seat: e.target.value })}
                    required
                    placeholder="e.g., 2500"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Available Seats <span className={styles.required}>*</span></label>
                  <input
                    type="number"
                    value={formData.available_seats}
                    onChange={e => setFormData({ ...formData, available_seats: e.target.value })}
                    required
                    placeholder="Auto-filled"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <CheckCircleIcon />
              <h2>Status</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.statusGrid}>
                {[
                  { value: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
                  { value: 'in_progress', label: 'In Progress', color: '#f59e0b' },
                  { value: 'completed', label: 'Completed', color: '#10b981' },
                  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
                ].map(st => (
                  <button
                    type="button"
                    key={st.value}
                    className={`${styles.statusOption} ${formData.status === st.value ? styles.statusActive : ''}`}
                    style={{ '--status-color': st.color }}
                    onClick={() => setFormData(prev => ({ ...prev, status: st.value }))}
                  >
                    <span className={styles.statusDot} />
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.formColumn}>
          {/* Departure Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <CalendarMonthIcon />
              <h2>Departure</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label htmlFor="departure-date">Departure Date <span className={styles.required}>*</span></label>
                <CalendarDatePicker
                  id="departure-date"
                  label="Departure date"
                  value={formData.departure_date}
                  onChange={value => setFormData(prev => ({ ...prev, departure_date: value, arrival_date: !prev.arrival_date || prev.arrival_date < value ? value : prev.arrival_date }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Departure Time <span className={styles.required}>*</span></label>
                <div className={styles.timeRow}>
                  <select value={depParsed.h} onChange={e => {
                    setFormData({ ...formData, departure_time: to24h(e.target.value, depParsed.m || 0, depParsed.ampm) });
                  }} required>
                    <option value="">Hour</option>
                    {hours12.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className={styles.timeSep}>:</span>
                  <select value={depParsed.m} onChange={e => {
                    setFormData({ ...formData, departure_time: to24h(depParsed.h || 12, e.target.value, depParsed.ampm) });
                  }} required>
                    <option value="">Min</option>
                    {minutesList.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                  <select value={depParsed.ampm} onChange={e => {
                    setFormData({ ...formData, departure_time: to24h(depParsed.h || 12, depParsed.m || 0, e.target.value) });
                  }} className={styles.ampmSelect}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Arrival Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <AccessTimeIcon />
              <h2>Arrival</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label htmlFor="arrival-date">Arrival Date <span className={styles.required}>*</span></label>
                <CalendarDatePicker
                  id="arrival-date"
                  label="Arrival date"
                  value={formData.arrival_date}
                  onChange={value => setFormData(prev => ({ ...prev, arrival_date: value }))}
                  min={formData.departure_date}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Arrival Time <span className={styles.required}>*</span></label>
                <div className={styles.timeRow}>
                  <select value={arrParsed.h} onChange={e => {
                    setFormData({ ...formData, arrival_time: to24h(e.target.value, arrParsed.m || 0, arrParsed.ampm) });
                  }} required>
                    <option value="">Hour</option>
                    {hours12.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className={styles.timeSep}>:</span>
                  <select value={arrParsed.m} onChange={e => {
                    setFormData({ ...formData, arrival_time: to24h(arrParsed.h || 12, e.target.value, arrParsed.ampm) });
                  }} required>
                    <option value="">Min</option>
                    {minutesList.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                  <select value={arrParsed.ampm} onChange={e => {
                    setFormData({ ...formData, arrival_time: to24h(arrParsed.h || 12, arrParsed.m || 0, e.target.value) });
                  }} className={styles.ampmSelect}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.formFooter}>
          <Link href="/admin/schedules" className={styles.cancelBtn}>Cancel</Link>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <><span className={styles.spinner} /> Creating...</>
            ) : (
              <><ScheduleIcon /> Create Schedule</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSchedulePage;
