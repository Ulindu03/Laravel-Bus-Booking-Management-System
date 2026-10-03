'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatsCard from '@/components/admin/StatsCard';
import routeService from '@/app/api/routeService';
import styles from './routesPage.module.css';

import RouteIcon from '@mui/icons-material/Route';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { sriLankaLocations } from '@/utils/locations';

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '', route_number: '', origin: '', destination: '', stops: [],
    distance_km: '', duration_mins: '', base_fare: '', fare_matrix: {}, status: 'active'
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Auto-generate route name based on origin, destination, and route number
  useEffect(() => {
    if (!editingRoute && formData.origin && formData.destination) {
      let autoName = `${formData.origin} – ${formData.destination}`;
      if (formData.route_number) {
        autoName += ` (${formData.route_number})`;
      }
      setFormData(prev => ({ ...prev, name: autoName }));
    }
  }, [formData.origin, formData.destination, formData.route_number, editingRoute]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await routeService.getAllRoutes();
      setRoutes(res.data || []);
    } catch (err) {
      setError('Failed to load routes');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRoute(null);
    setFormData({ name: '', route_number: '', origin: '', destination: '', stops: [], distance_km: '', duration_mins: '', base_fare: '', fare_matrix: {}, status: 'active' });
    setDrawerOpen(true);
  };

  const openEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name || '',
      route_number: route.route_number || '',
      origin: route.origin || '',
      destination: route.destination || '',
      stops: route.stops || [],
      distance_km: route.distance_km || '',
      duration_mins: route.duration_mins || '',
      base_fare: route.base_fare || '',
      fare_matrix: route.fare_matrix || {},
      status: route.status || 'active',
    });
    setDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = { ...formData, distance_km: formData.distance_km ? parseFloat(formData.distance_km) : null, duration_mins: formData.duration_mins ? parseInt(formData.duration_mins) : null, base_fare: parseFloat(formData.base_fare) };
      if (editingRoute) {
        await routeService.updateRoute(editingRoute.id, data);
        setSuccessMsg('Route updated successfully');
      } else {
        await routeService.createRoute(data);
        setSuccessMsg('Route created successfully');
      }
      setDrawerOpen(false);
      fetchRoutes();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save route');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await routeService.deleteRoute(deleteConfirm.id);
      setRoutes(routes.filter(r => r.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      setSuccessMsg('Route deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to delete route');
    }
  };

  const addStop = () => {
    setFormData(prev => ({ ...prev, stops: [...prev.stops, { name: '', duration_mins: 0 }] }));
  };

  const removeStop = (index) => {
    const newStops = [...formData.stops];
    newStops.splice(index, 1);
    setFormData({ ...formData, stops: newStops });
  };

  const getMatrixPairs = () => {
    const points = [formData.origin, ...(formData.stops || []).map(s => s.name), formData.destination].filter(Boolean);
    const pairs = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        pairs.push({ from: points[i], to: points[j] });
      }
    }
    return pairs;
  };

  const handleMatrixChange = (from, to, value) => {
    setFormData(prev => ({
      ...prev,
      fare_matrix: {
        ...(prev.fare_matrix || {}),
        [`${from}-${to}`]: value,
        [`${to}-${from}`]: value // Bidirectional auto-fill
      }
    }));
  };

  const updateStop = (index, field, value) => {
    setFormData(prev => {
      const stops = [...prev.stops];
      stops[index] = { ...stops[index], [field]: value };
      return { ...prev, stops };
    });
  };

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(r => r.status === 'active').length;
  const inactiveRoutes = routes.filter(r => r.status === 'inactive').length;

  const columns = [
    { key: 'name', label: 'Route Name', accessor: 'name', render: (row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{row.name}</div>
        {row.route_number && <div style={{ fontSize: '0.8rem', color: '#888' }}>No: {row.route_number}</div>}
      </div>
    )},
    { key: 'path', label: 'Path', render: (row) => (
      <span className={styles.routePath}>{row.origin} → {row.destination}</span>
    )},
    { key: 'distance_km', label: 'Distance', accessor: 'distance_km', render: (row) => row.distance_km ? `${row.distance_km} km` : '—' },
    { key: 'duration_mins', label: 'Duration', accessor: 'duration_mins', render: (row) => row.duration_mins ? `${Math.floor(row.duration_mins / 60)}h ${row.duration_mins % 60}m` : '—' },
    { key: 'base_fare', label: 'Base Fare', accessor: 'base_fare', render: (row) => <span className={styles.fareText}>LKR {parseFloat(row.base_fare).toLocaleString()}</span> },
    { key: 'stops_count', label: 'Stops', render: (row) => <span className={styles.stopsCount}>{(row.stops || []).length} stops</span> },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`${styles.badge} ${row.status === 'active' ? styles.badgeActive : styles.badgeInactive}`}>
        {row.status === 'active' ? <CheckCircleIcon /> : <CancelIcon />}
        {row.status}
      </span>
    )},
  ];

  const allTowns = sriLankaLocations.flatMap(district => district.towns).sort();

  return (
    <div className={styles.page}>
      {/* Success/Error Messages */}
      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
      {error && <div className={styles.errorAlert}>{error} <button onClick={() => setError(null)}>×</button></div>}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatsCard icon={<RouteIcon />} label="Total Routes" value={totalRoutes} gradient="purple" />
        <StatsCard icon={<CheckCircleIcon />} label="Active" value={activeRoutes} gradient="green" />
        <StatsCard icon={<CancelIcon />} label="Inactive" value={inactiveRoutes} gradient="orange" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={routes}
        loading={loading}
        searchPlaceholder="Search routes..."
        emptyMessage="No routes found"
        emptySubMessage="Create your first route to get started"
        headerActions={
          <button className={styles.addBtn} onClick={openCreate}>
            <AddIcon /> Add Route
          </button>
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
              <h2>{editingRoute ? 'Edit Route' : 'Create Route'}</h2>
              <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}><CloseIcon /></button>
            </div>
            <form onSubmit={handleSave} className={styles.drawerBody}>
              <div className={styles.sectionCard}>
                <h3 className={styles.sectionTitle}><RouteIcon style={{fontSize: '16px'}}/> Route Details</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ position: 'relative', zIndex: 10 }}>
                    <label>Origin</label>
                    <SearchableSelect 
                      value={formData.origin} 
                      onChange={val => setFormData({...formData, origin: val})} 
                      options={allTowns} 
                      placeholder="Select Origin"
                    />
                  </div>
                  <div className={styles.formGroup} style={{ position: 'relative', zIndex: 10 }}>
                    <label>Destination</label>
                    <SearchableSelect 
                      value={formData.destination} 
                      onChange={val => setFormData({...formData, destination: val})} 
                      options={allTowns} 
                      placeholder="Select Destination"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Route Number (Optional)</label>
                    <input type="text" value={formData.route_number} onChange={e => setFormData({...formData, route_number: e.target.value})} placeholder="e.g., 87, EX-1" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Route Name (Auto-generated)</label>
                    <input type="text" value={formData.name} disabled placeholder="e.g., Colombo – Kandy" />
                  </div>
                </div>
              </div>

              <div className={styles.sectionCard}>
                <h3 className={styles.sectionTitle}><CheckCircleIcon style={{fontSize: '16px'}}/> Journey Info</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Distance (km)</label>
                    <input type="number" step="0.01" value={formData.distance_km} onChange={e => setFormData({...formData, distance_km: e.target.value})} placeholder="e.g., 115.5" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Duration</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="number" 
                        min="0"
                        style={{ flex: 1, minWidth: 0 }}
                        value={formData.duration_mins ? Math.floor(formData.duration_mins / 60) : ''} 
                        onChange={e => {
                          const h = parseInt(e.target.value) || 0;
                          const m = formData.duration_mins ? formData.duration_mins % 60 : 0;
                          setFormData({...formData, duration_mins: h * 60 + m});
                        }} 
                        placeholder="Hours" 
                      />
                      <input 
                        type="number" 
                        min="0"
                        max="59"
                        style={{ flex: 1, minWidth: 0 }}
                        value={formData.duration_mins !== '' && formData.duration_mins !== null ? formData.duration_mins % 60 : ''} 
                        onChange={e => {
                          const m = parseInt(e.target.value) || 0;
                          const h = formData.duration_mins ? Math.floor(formData.duration_mins / 60) : 0;
                          setFormData({...formData, duration_mins: h * 60 + m});
                        }} 
                        placeholder="Mins" 
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Base Fare (LKR)</label>
                    <input type="number" step="0.01" value={formData.base_fare} onChange={e => setFormData({...formData, base_fare: e.target.value})} required placeholder="e.g., 1500.00" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stops */}
              <div className={styles.sectionCard}>
                <div className={styles.stopsHeader}>
                  <h3 className={styles.sectionTitle} style={{border: 'none', margin: 0, padding: 0}}><AddCircleOutlineIcon style={{fontSize: '16px'}}/> Intermediate Stops</h3>
                  <button type="button" className={styles.addStopBtn} onClick={addStop}><AddCircleOutlineIcon /> Add Stop</button>
                </div>
                {formData.stops.map((stop, i) => (
                  <div key={i} className={styles.stopRow} style={{ position: 'relative', zIndex: 5 - i }}>
                    <div style={{ flex: 1 }}>
                      <SearchableSelect 
                        value={stop.name} 
                        onChange={val => updateStop(i, 'name', val)} 
                        options={allTowns} 
                        placeholder="Select Stop"
                      />
                    </div>
                    <input type="number" placeholder="Mins" value={stop.duration_mins} onChange={e => updateStop(i, 'duration_mins', parseInt(e.target.value) || 0)} className={styles.stopMins} required />
                    <button type="button" className={styles.removeStopBtn} onClick={() => removeStop(i)}><RemoveCircleOutlineIcon /></button>
                  </div>
                ))}
              </div>

              {/* Fare Matrix Builder */}
              {getMatrixPairs().length > 0 && (
                <div className={styles.sectionCard}>
                  <h3 className={styles.sectionTitle} style={{border: 'none', margin: 0, padding: 0}}><RouteIcon style={{fontSize: '16px'}}/> Section Fares (Fare Matrix)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {getMatrixPairs().map(pair => (
                      <div key={`${pair.from}-${pair.to}`} className={styles.stopRow}>
                        <div style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                          <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{pair.from}</span>
                          <span style={{margin: '0 8px', color: '#06b6d4'}}>➔</span>
                          <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{pair.to}</span>
                        </div>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="LKR" 
                          value={formData.fare_matrix[`${pair.from}-${pair.to}`] || ''} 
                          onChange={e => handleMatrixChange(pair.from, pair.to, e.target.value)} 
                          style={{ width: '100px', flex: 'none' }}
                          required 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.drawerActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setDrawerOpen(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Saving...' : editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
            <datalist id="locations-list">
              {sriLankaLocations.map((district) => (
                <optgroup key={district.district} label={district.district}>
                  {district.towns.map(town => (
                    <option key={town} value={town} />
                  ))}
                </optgroup>
              ))}
            </datalist>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <>
          <div className={styles.overlay} onClick={() => setDeleteConfirm(null)} />
          <div className={styles.modal}>
            <h3>Delete Route</h3>
            <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.</p>
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

export default RoutesPage;
