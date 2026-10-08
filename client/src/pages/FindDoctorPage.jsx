import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Stethoscope,
  Video,
  Clock,
  Sparkles,
  Loader2,
  Users,
  Building2,
  AlertCircle,
  MapPin,
  Navigation,

  Compass,
  X,
} from 'lucide-react';
import api from '../services/api';
import DoctorCard from '../components/DoctorCard';
import BookingModal from '../components/BookingModal';


export default function FindDoctorPage() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [videoOnly, setVideoOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Geolocation & Nearby state
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [nearbyActive, setNearbyActive] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
 

  // Booking modal state
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Request browser geolocation once (single-shot, does not track continuously)
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Detected Location:", {
          latitude,
          longitude,
        });
        setUserLocation({ latitude, longitude });
        setNearbyActive(true);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError(
              'Location access was denied. Please allow location access or search for doctors manually.'
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError(
              'Location information is unavailable. Please check device GPS settings.'
            );
            break;
          case err.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('Unable to retrieve your current location.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 300000,
      }
    );
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (selectedSpecialization && selectedSpecialization !== 'All') {
        params.append('specialization', selectedSpecialization);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (videoOnly) {
        params.append('videoOnly', 'true');
      }

      // If Nearby mode is active and we have coordinates, query /doctors/nearby
      if (nearbyActive && userLocation) {
        params.append('latitude', userLocation.latitude);
        params.append('longitude', userLocation.longitude);
        params.append('radius', radiusKm * 1000); // convert km to meters

        const [docsRes, specsRes] = await Promise.all([
          api.get(`/doctors/nearby?${params.toString()}`),
          api.get('/doctors/specializations'),
        ]);

        if (docsRes.data.success) {
          let list = docsRes.data.doctors || [];
          // Optional client-side sort
          if (sortBy === 'wait_asc') {
            list = [...list].sort(
              (a, b) =>
                (a.queue?.estimatedWaitMinutes || a.liveQueue?.estimatedWaitMinutes || 0) -
                (b.queue?.estimatedWaitMinutes || b.liveQueue?.estimatedWaitMinutes || 0)
            );
          } else if (sortBy === 'fee_asc') {
            list = [...list].sort((a, b) => a.consultationFee - b.consultationFee);
          } else if (sortBy === 'distance_asc') {
            list = [...list].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
          }
          setDoctors(list);
        }
        if (specsRes.data.success) {
          setSpecializations(['All', ...(specsRes.data.specializations || [])]);
        }
      } else {
        // Standard query
        if (sortBy === 'wait_asc') {
          params.append('sort', 'wait_asc');
        } else if (sortBy === 'fee_asc') {
          params.append('sort', 'fee_asc');
        }

        const [docsRes, specsRes] = await Promise.all([
          api.get(`/doctors?${params.toString()}`),
          api.get('/doctors/specializations'),
        ]);

        if (docsRes.data.success) {
          setDoctors(docsRes.data.doctors || []);
        }
        if (specsRes.data.success) {
          setSpecializations(['All', ...(specsRes.data.specializations || [])]);
        }
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Unable to load available doctors right now. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialization, videoOnly, sortBy, nearbyActive, userLocation, radiusKm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleOpenBooking = (doctor) => {
    setSelectedDoctorForBooking(doctor);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
          <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
          <span>PRESCRIPTO DOCTOR DISCOVERY</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Find the Right Doctor, Without the Long Wait
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl mt-1">
              Explore certified practitioners near you, check real-time patient traffic and wait times, and book verified appointments.
            </p>
          </div>

          {/* Quick Location Action Button */}
          <div>
            {!nearbyActive ? (
              <button
                onClick={requestUserLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-200 cursor-pointer disabled:opacity-70"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Locating you...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Find Nearby Doctors</span>
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Nearby Mode Active</span>
                <button
                  onClick={() => {
                    setUserLocation({
                      latitude: 28.6289,
                      longitude: 77.2065,
                    });
                    setNearbyActive(true);
                    setRadiusKm(10);
                  }}
                  className="ml-2 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold transition"
                  title="Use Central Delhi demo location"
                >
                  Demo Location
                </button>
                <button
                  onClick={() => {
                    setNearbyActive(false);
                    setUserLocation(null);
                  }}
                  className="ml-1 text-slate-400 hover:text-slate-600 font-bold"
                  title="Turn off nearby mode"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Error Notice (Graceful Degradation & One-Click Demo Mode) */}
      {locationError && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{locationError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Sample patient coordinate (Central Delhi near Connaught Place)
                setUserLocation({ latitude: 28.6289, longitude: 77.2065 });
                setNearbyActive(true);
                setLocationError('');
              }}
              className="px-3 py-1 rounded-lg bg-amber-200/90 hover:bg-amber-300 text-amber-900 font-semibold text-xs transition cursor-pointer"
            >
              Use Demo Location (Central Delhi)
            </button>
            <button
              onClick={() => setLocationError('')}
              className="text-amber-500 hover:text-amber-700 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm mb-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doctor name, specialization, clinic, or location..."
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm shadow-blue-200"
          >
            Search
          </button>
        </form>

        {/* Specialization Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {specializations.map((spec) => {
            const isSelected = selectedSpecialization === spec;
            return (
              <button
                key={spec}
                onClick={() => setSelectedSpecialization(spec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${isSelected
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
              >
                {spec}
              </button>
            );
          })}
        </div>

        {/* Sorting, Quick Toggles & Radius Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={videoOnly}
                onChange={(e) => setVideoOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-blue-600" />
                <span>Video Consultations Only</span>
              </span>
            </label>

            {/* Radius selector (when nearby is active) */}
            {nearbyActive && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>Radius:</span>
                </span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value={5}>Within 5 km</option>
                  <option value={10}>Within 10 km</option>
                  <option value={20}>Within 20 km</option>
                  <option value={50}>Within 50 km</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
       
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="rating">Top Rated</option>
                {nearbyActive && <option value="distance_asc">Nearest Distance</option>}
                <option value="wait_asc">Lowest Wait Time</option>
                <option value="fee_asc">Consultation Fee (Low to High)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

   
    

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">
            {nearbyActive
              ? 'Finding nearby certified doctors and live queue status...'
              : 'Checking live doctor availability and wait times...'}
          </p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No doctors found</h3>
          <p className="text-xs text-slate-500 mb-4">
            {nearbyActive
              ? `No PRESCRIPTO doctors found within ${radiusKm} km. Try expanding the search radius.`
              : 'No doctors matched your selected filters or search terms.'}
          </p>
          <button
            onClick={() => {
              setSelectedSpecialization('All');
              setSearchTerm('');
              setVideoOnly(false);
              if (nearbyActive) setRadiusKm(50);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor._id || doctor.id}
              doctor={doctor}
              onBookClick={handleOpenBooking}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        doctor={selectedDoctorForBooking}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => {
          fetchDoctors();
        }}
      />
    </div>
  );
}

