'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import busService from '@/app/api/busService';
import styles from './createBus.module.css';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AirlineSeatReclineNormalIcon from '@mui/icons-material/AirlineSeatReclineNormal';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import WifiIcon from '@mui/icons-material/Wifi';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import UsbIcon from '@mui/icons-material/Usb';
import LightModeIcon from '@mui/icons-material/LightMode';
import PowerIcon from '@mui/icons-material/Power';
import CloseIcon from '@mui/icons-material/Close';

const amenityOptions = [
  { name: 'WiFi', icon: <WifiIcon /> },
  { name: 'Charging Ports', icon: <BatteryChargingFullIcon /> },
  { name: 'AC', icon: <AcUnitIcon /> },
  { name: 'Water', icon: <LocalDrinkIcon /> },
  { name: 'USB', icon: <UsbIcon /> },
  { name: 'Reading Light', icon: <LightModeIcon /> },
  { name: 'Power Outlet', icon: <PowerIcon /> },
];

const busTypes = [
  { value: 'normal', label: 'Normal', description: 'Standard seating', color: '#64748b' },
  { value: 'semi_luxury', label: 'Semi Luxury', description: 'Comfortable seats', color: '#3b82f6' },
  { value: 'luxury', label: 'Luxury', description: 'Premium experience', color: '#8b5cf6' },
  { value: 'ac', label: 'AC', description: 'Air conditioned', color: '#10b981' },
];

const CreateBusPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    bus_number: '',
    name: '',
    type: '',
    total_seats: '',
    seat_layout: '2x2',
    amenities: [],
    status: 'active',
    image: '',
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.bus_number.trim()) newErrors.bus_number = 'Bus number is required';
    if (!formData.name.trim()) newErrors.name = 'Bus name is required';
    if (!formData.type) newErrors.type = 'Select a bus type';
    if (!formData.total_seats || formData.total_seats <= 0) newErrors.total_seats = 'Enter valid seat count';
    if (!formData.seat_layout.trim()) newErrors.seat_layout = 'Seat layout is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      setError('');
      await busService.createBus({
        ...formData,
        total_seats: parseInt(formData.total_seats, 10),
      });
      router.push('/admin/buses');
    } catch (err) {
      setError(err.message || 'Failed to create bus. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/admin/buses" className={styles.backBtn}>
          <ArrowBackIcon /> Back to Buses
        </Link>
        <div className={styles.headerTitle}>
          <div className={styles.headerIcon}>
            <DirectionsBusIcon />
          </div>
          <div>
            <h1>Add New Bus</h1>
            <p>Register a new bus to the fleet</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorAlert}>
          <span>{error}</span>
          <button onClick={() => setError('')}><CloseIcon style={{fontSize: 16}} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* Left Column */}
        <div className={styles.formColumn}>
          {/* Bus Details Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <DirectionsBusIcon />
              <h2>Bus Details</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label>Bus Number <span className={styles.required}>*</span></label>
                <input
                  name="bus_number"
                  value={formData.bus_number}
                  onChange={handleInputChange}
                  placeholder="e.g., NB-1234"
                  className={errors.bus_number ? styles.inputError : ''}
                />
                {errors.bus_number && <span className={styles.errorText}>{errors.bus_number}</span>}
              </div>
              <div className={styles.formGroup}>
                <label>Bus Name <span className={styles.required}>*</span></label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Colombo Express"
                  className={errors.name ? styles.inputError : ''}
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Total Seats <span className={styles.required}>*</span></label>
                  <input
                    type="number"
                    name="total_seats"
                    min="1"
                    value={formData.total_seats}
                    onChange={handleInputChange}
                    placeholder="e.g., 54"
                    className={errors.total_seats ? styles.inputError : ''}
                  />
                  {errors.total_seats && <span className={styles.errorText}>{errors.total_seats}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Seat Layout <span className={styles.required}>*</span></label>
                  <select name="seat_layout" value={formData.seat_layout} onChange={handleInputChange}>
                    <option value="2x2">2 × 2</option>
                    <option value="2x3">2 × 3</option>
                    <option value="3x2">3 × 2</option>
                  </select>
                  {errors.seat_layout && <span className={styles.errorText}>{errors.seat_layout}</span>}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Image URL <span className={styles.optional}>(Optional)</span></label>
                <div className={styles.inputWithIcon}>
                  <ImageIcon className={styles.inputIcon} />
                  <input
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/bus-image.jpg"
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
                {['active', 'inactive', 'maintenance'].map((st) => (
                  <button
                    type="button"
                    key={st}
                    className={`${styles.statusOption} ${formData.status === st ? styles.statusActive : ''} ${styles[`status_${st}`]}`}
                    onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                  >
                    <span className={styles.statusDot} />
                    <span>{st.charAt(0).toUpperCase() + st.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.formColumn}>
          {/* Bus Type Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <ViewModuleIcon />
              <h2>Bus Type <span className={styles.required}>*</span></h2>
            </div>
            <div className={styles.cardBody}>
              {errors.type && <span className={styles.errorText} style={{ marginBottom: 8, display: 'block' }}>{errors.type}</span>}
              <div className={styles.typeGrid}>
                {busTypes.map((bt) => (
                  <button
                    type="button"
                    key={bt.value}
                    className={`${styles.typeCard} ${formData.type === bt.value ? styles.typeSelected : ''}`}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: bt.value }));
                      if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
                    }}
                    style={{ '--type-color': bt.color }}
                  >
                    <div className={styles.typeIcon}>
                      <DirectionsBusIcon />
                    </div>
                    <span className={styles.typeLabel}>{bt.label}</span>
                    <span className={styles.typeDesc}>{bt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amenities Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <WifiIcon />
              <h2>Amenities <span className={styles.optional}>(Optional)</span></h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.amenitiesGrid}>
                {amenityOptions.map((am) => (
                  <button
                    type="button"
                    key={am.name}
                    className={`${styles.amenityChip} ${formData.amenities.includes(am.name) ? styles.amenityActive : ''}`}
                    onClick={() => toggleAmenity(am.name)}
                  >
                    {am.icon}
                    <span>{am.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.formFooter}>
          <Link href="/admin/buses" className={styles.cancelBtn}>
            Cancel
          </Link>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <><span className={styles.spinner} /> Creating...</>
            ) : (
              <><DirectionsBusIcon /> Create Bus</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBusPage;
