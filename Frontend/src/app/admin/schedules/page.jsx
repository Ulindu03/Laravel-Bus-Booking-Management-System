'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable from '@/components/admin/DataTable';
import StatsCard from '@/components/admin/StatsCard';
import scheduleService from '@/app/api/scheduleService';
import busService from '@/app/api/busService';
import routeService from '@/app/api/routeService';
import styles from '../routes/routesPage.module.css';

import ScheduleIcon from '@mui/icons-material/Schedule';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// Helper arrays for time dropdowns
const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

// Convert 12h to 24h format string "HH:MM"
const to24h = (h, m, ampm) => {
  let hour24 = parseInt(h);
  if (ampm === 'AM' && hour24 === 12) hour24 = 0;
  if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Parse 24h "HH:MM" to { h, m, ampm }
const parse24h = (timeStr) => {
  if (!timeStr) return { h: '', m: '', ampm: 'AM' };
  const [hh, mm] = timeStr.split(':').map(Number);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return { h: String(h), m: String(mm), ampm };
};

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    bus_id: '', route_id: '', departure_date: '', departure_time: '', arrival_date: '', arrival_time: '',
    price_per_seat: '', available_seats: '', status: 'scheduled'
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [schedRes, busRes, routeRes] = await Promise.all([
        scheduleService.getAllSchedules(),
        busService.getAllBuses(),
        routeService.getAllRoutes(),
      ]);
      setSchedules(schedRes.data || []);
      setBuses(busRes.data || []);
      setRoutes(routeRes.data || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingSchedule(null);
    setFormData({ bus_id: '', route_id: '', departure_date: '', departure_time: '', arrival_date: '', arrival_time: '', price_per_seat: '', available_seats: '', status: 'scheduled' });
    setDrawerOpen(true);
  };

  const openEdit = (sched) => {
    setEditingSchedule(sched);
    const dep = sched.departure_time ? new Date(sched.departure_time) : null;
    const arr = sched.arrival_time ? new Date(sched.arrival_time) : null;
    setFormData({
      bus_id: sched.bus_id || '', route_id: sched.route_id || '',
      departure_date: dep ? dep.toISOString().slice(0, 10) : '',
      departure_time: dep ? dep.toTimeString().slice(0, 5) : '',
      arrival_date: arr ? arr.toISOString().slice(0, 10) : '',
      arrival_time: arr ? arr.toTimeString().slice(0, 5) : '',
      price_per_seat: sched.price_per_seat || '', available_seats: sched.available_seats || '',
      status: sched.status || 'scheduled',
    });
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const departure = `${formData.departure_date}T${formData.departure_time}`;
      const arrival = `${formData.arrival_date}T${formData.arrival_time}`;
      const data = {
        bus_id: formData.bus_id,
        route_id: formData.route_id,
        departure_time: departure,
        arrival_time: arrival,
        price_per_seat: parseFloat(formData.price_per_seat),
        available_seats: parseInt(formData.available_seats),
        status: formData.status,
      };
      if (editingSchedule) {
        await scheduleService.updateSchedule(editingSchedule.id, data);
        setSuccessMsg('Schedule updated successfully');
      } else {
        await scheduleService.createSchedule(data);
        setSuccessMsg('Schedule created successfully');
      }
      setDrawerOpen(false);
      fetchAll();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await scheduleService.deleteSchedule(deleteConfirm.id);
      setSchedules(schedules.filter(s => s.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setSuccessMsg('Schedule deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to delete schedule');
    }
  };

  // When bus is selected, auto-fill available_seats
  const handleBusSelect = (busId) => {
    setFormData(prev => {
      const bus = buses.find(b => b.id === parseInt(busId));
      return { ...prev, bus_id: busId, available_seats: bus ? bus.total_seats : prev.available_seats };
    });
  };

  // When route is selected, auto-fill price_per_seat from base_fare
  const handleRouteSelect = (routeId) => {
    const route = routes.find(r => r.id === parseInt(routeId));
    setFormData(prev => ({
      ...prev,
      route_id: routeId,
      price_per_seat: route ? route.base_fare : prev.price_per_seat,
    }));
  };

  const getStatusStyle = (status) => {
    const map = {
      scheduled: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
      in_progress: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      completed: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    };
    return map[status] || map.scheduled;
  };

  const totalSchedules = schedules.length;
  const upcoming = schedules.filter(s => s.status === 'scheduled').length;
  const inProgress = schedules.filter(s => s.status === 'in_progress').length;
  const completed = schedules.filter(s => s.status === 'completed').length;

  const columns = [
    { key: 'bus', label: 'Bus', render: (row) => <span style={{fontWeight: 600, color: '#fff'}}>{row.bus?.name || `Bus #${row.bus_id}`}</span> },
    { key: 'route', label: 'Route', render: (row) => (
      <span className={styles.routePath}>{row.route ? `${row.route.origin} → ${row.route.destination}` : `Route #${row.route_id}`}</span>
    )},
    { key: 'departure_time', label: 'Departure', render: (row) => (
      <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
        <span style={{color:'#fff',fontWeight:600,fontSize:'13px'}}>{new Date(row.departure_time).toLocaleDateString()}</span>
        <span style={{color:'rgba(255,255,255,0.5)',fontSize:'12px'}}>{new Date(row.departure_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
      </div>
    )},
    { key: 'arrival_time', label: 'Arrival', render: (row) => (
      <span style={{color:'rgba(255,255,255,0.6)',fontSize:'13px'}}>{new Date(row.arrival_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
    )},
    { key: 'price_per_seat', label: 'Price', render: (row) => <span className={styles.fareText}>LKR {parseFloat(row.price_per_seat).toLocaleString()}</span> },
    { key: 'available_seats', label: 'Seats', accessor: 'available_seats', align: 'center' },
    { key: 'status', label: 'Status', render: (row) => {
      const st = getStatusStyle(row.status);
      return <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600,color:st.color,background:st.bg,textTransform:'capitalize'}}>{row.status?.replace('_',' ')}</span>;
    }},
  ];

  return (
    <div className={styles.page}>
      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
      {error && <div className={styles.errorAlert}>{error} <button onClick={() => setError(null)}>×</button></div>}

      <div className={styles.statsGrid}>
        <StatsCard icon={<ScheduleIcon />} label="Total Schedules" value={totalSchedules} gradient="blue" />
        <StatsCard icon={<PlayArrowIcon />} label="Upcoming" value={upcoming} gradient="cyan" />
        <StatsCard icon={<CheckCircleIcon />} label="Completed" value={completed} gradient="green" />
      </div>

      <DataTable
        columns={columns}
        data={schedules}
        loading={loading}
        searchPlaceholder="Search schedules..."
        emptyMessage="No schedules found"
        emptySubMessage="Create your first schedule to get started"
        headerActions={
          <Link href="/admin/schedules/create" className={styles.addBtn}><AddIcon /> Add Schedule</Link>
        }
        actions={(row) => (
          <>
            <button className={styles.actionBtn} onClick={() => openEdit(row)} title="Edit"><EditIcon /></button>
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setDeleteConfirm(row)} title="Delete"><DeleteIcon /></button>
          </>
        )}
      />

      {/* Create/Edit Drawer */}
      {drawerOpen && (
        <>
          <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2>{editingSchedule ? 'Edit Schedule' : 'Create Schedule'}</h2>
              <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}><CloseIcon /></button>
            </div>
            <form onSubmit={handleSave} className={styles.drawerBody}>
              <div className={styles.formGroup}>
                <label>Bus</label>
                <select value={formData.bus_id} onChange={e => handleBusSelect(e.target.value)} required>
                  <option value="">Select a bus...</option>
                  {buses.filter(b => b.status === 'active').map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.bus_number}) — {b.total_seats} seats</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Route</label>
                <select value={formData.route_id} onChange={e => handleRouteSelect(e.target.value)} required>
                  <option value="">Select a route...</option>
                  {routes.filter(r => r.status === 'active').map(r => (
                    <option key={r.id} value={r.id}>{r.origin} → {r.destination} ({r.name})</option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Departure Date</label>
                  <input type="date" value={formData.departure_date} onChange={e => {
                    setFormData({...formData, departure_date: e.target.value, arrival_date: formData.arrival_date || e.target.value});
                  }} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Arrival Date</label>
                  <input type="date" value={formData.arrival_date} onChange={e => setFormData({...formData, arrival_date: e.target.value})} min={formData.departure_date} required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Departure Time</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={parse24h(formData.departure_time).h} onChange={e => {
                    const p = parse24h(formData.departure_time);
                    setFormData({...formData, departure_time: to24h(e.target.value, p.m || 0, p.ampm)});
                  }} required style={{ flex: 1 }}>
                    <option value="">Hr</option>
                    {hours12.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select value={parse24h(formData.departure_time).m} onChange={e => {
                    const p = parse24h(formData.departure_time);
                    setFormData({...formData, departure_time: to24h(p.h || 12, e.target.value, p.ampm)});
                  }} required style={{ flex: 1 }}>
                    <option value="">Min</option>
                    {minutes.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                  <select value={parse24h(formData.departure_time).ampm} onChange={e => {
                    const p = parse24h(formData.departure_time);
                    setFormData({...formData, departure_time: to24h(p.h || 12, p.m || 0, e.target.value)});
                  }} style={{ flex: 1 }}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Arrival Time</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={parse24h(formData.arrival_time).h} onChange={e => {
                    const p = parse24h(formData.arrival_time);
                    setFormData({...formData, arrival_time: to24h(e.target.value, p.m || 0, p.ampm)});
                  }} required style={{ flex: 1 }}>
                    <option value="">Hr</option>
                    {hours12.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select value={parse24h(formData.arrival_time).m} onChange={e => {
                    const p = parse24h(formData.arrival_time);
                    setFormData({...formData, arrival_time: to24h(p.h || 12, e.target.value, p.ampm)});
                  }} required style={{ flex: 1 }}>
                    <option value="">Min</option>
                    {minutes.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                  <select value={parse24h(formData.arrival_time).ampm} onChange={e => {
                    const p = parse24h(formData.arrival_time);
                    setFormData({...formData, arrival_time: to24h(p.h || 12, p.m || 0, e.target.value)});
                  }} style={{ flex: 1 }}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price per Seat (LKR)</label>
                  <input type="number" step="0.01" value={formData.price_per_seat} onChange={e => setFormData({...formData, price_per_seat: e.target.value})} required placeholder="e.g., 1500" />
                </div>
                <div className={styles.formGroup}>
                  <label>Available Seats</label>
                  <input type="number" value={formData.available_seats} onChange={e => setFormData({...formData, available_seats: e.target.value})} required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className={styles.drawerActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setDrawerOpen(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {deleteConfirm && (
        <>
          <div className={styles.overlay} onClick={() => setDeleteConfirm(null)} />
          <div className={styles.modal}>
            <h3>Delete Schedule</h3>
            <p>Are you sure you want to delete this schedule? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className={styles.deleteBtnLg} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SchedulesPage;
