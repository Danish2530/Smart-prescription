import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import {
  MapPin,
  Navigation,
  Clock,
  Users,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function DoctorMap({
  userLocation,
  doctors = [],
  selectedDoctor,
  onSelectDoctor,
  onBookDoctor,
}) {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [activeDoctor, setActiveDoctor] = useState(selectedDoctor || null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Sync selectedDoctor prop
  useEffect(() => {
    if (selectedDoctor) {
      setActiveDoctor(selectedDoctor);
    }
  }, [selectedDoctor]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!apiKey) {
      setMapError('Google Maps API key is not configured. (VITE_GOOGLE_MAPS_API_KEY)');
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    let isMounted = true;

    loader
      .load()
      .then((google) => {
        if (!isMounted || !mapRef.current) return;

        const centerLat = userLocation?.latitude || 28.6139;
        const centerLng = userLocation?.longitude || 77.209;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi.medical',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }],
            },
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        setMapInstance(map);
        setMapError(null);
      })
      .catch((err) => {
        console.warn('[DoctorMap] Google Maps load error:', err.message);
        setMapError('Map temporarily unavailable. You can still view nearby doctors.');
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Update Markers on doctors or userLocation change
  useEffect(() => {
    if (!mapInstance || !window.google) return;

    const google = window.google;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    const bounds = new google.maps.LatLngBounds();

    // 1. Add User marker if location is available
    if (userLocation?.latitude && userLocation?.longitude) {
      const userLatLng = new google.maps.LatLng(
        userLocation.latitude,
        userLocation.longitude
      );

      // SVG pulse icon for user location
      const userMarker = new google.maps.Marker({
        position: userLatLng,
        map: mapInstance,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#2563eb', // blue-600
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        zIndex: 999,
      });

      userMarkerRef.current = userMarker;
      bounds.extend(userLatLng);
    }

    // 2. Add Doctor Markers
    doctors.forEach((doc) => {
      const coords = doc.location?.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2) return;

      const lng = coords[0];
      const lat = coords[1];
      const docLatLng = new google.maps.LatLng(lat, lng);

      // SVG pin for doctor
      const isSelected = activeDoctor && (activeDoctor._id === doc._id || activeDoctor.id === doc.id);

      const marker = new google.maps.Marker({
        position: docLatLng,
        map: mapInstance,
        title: doc.name,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: isSelected ? '#16a34a' : '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.6,
          anchor: new google.maps.Point(12, 22),
        },
        zIndex: isSelected ? 100 : 10,
      });

      marker.addListener('click', () => {
        setActiveDoctor(doc);
        if (onSelectDoctor) onSelectDoctor(doc);
        mapInstance.panTo(docLatLng);
      });

      markersRef.current.push(marker);
      bounds.extend(docLatLng);
    });

    // Fit bounds if markers exist
    if (doctors.length > 0 || userLocation) {
      mapInstance.fitBounds(bounds);
      // Prevent over-zooming on single marker
      const listener = google.maps.event.addListenerOnce(
        mapInstance,
        'idle',
        () => {
          if (mapInstance.getZoom() > 15) {
            mapInstance.setZoom(14);
          }
        }
      );
    }
  }, [mapInstance, doctors, userLocation, activeDoctor]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white mb-6">
      {/* Map View Header */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">
            Interactive Doctor Map
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500 font-medium">
            {doctors.length} nearby PRESCRIPTO clinics
          </span>
        </div>

        {userLocation && (
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
            <Navigation className="w-3 h-3 text-blue-600" />
            <span>Using your current location</span>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full h-80 sm:h-96 bg-slate-100">
        {mapError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Google Maps Notice
            </h4>
            <p className="text-xs text-slate-500 max-w-md mb-3">
              {mapError}
            </p>
            <p className="text-[11px] text-slate-400">
              You can still browse and book all nearby doctors with accurate live distances below.
            </p>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}

        {/* Selected Doctor Info Overlay (Interactive Marker Click) */}
        {activeDoctor && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200/90 z-20 transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {activeDoctor.name}
                </h4>
                <p className="text-xs font-medium text-blue-600">
                  {activeDoctor.specialization} • {activeDoctor.clinicName}
                </p>
              </div>
              <button
                onClick={() => setActiveDoctor(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded-md hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Distance & Medical Wait */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 my-2 border-y border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="font-semibold">
                  {activeDoctor.distanceKm !== undefined
                    ? `${activeDoctor.distanceKm} km`
                    : 'Nearby'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>
                  Wait:{' '}
                  <strong className="text-emerald-800">
                    {activeDoctor.queue?.estimatedWaitMinutes ??
                      activeDoctor.liveQueue?.estimatedWaitMinutes ??
                      10}
                    m
                  </strong>
                </span>
                <span className="text-[10px] text-slate-400">
                  ({activeDoctor.queue?.patientsAhead ??
                    activeDoctor.liveQueue?.patientsWaiting ??
                    0}{' '}
                  ahead)
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`/doctors/${activeDoctor._id || activeDoctor.id}`}
                className="flex-1 text-center py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                View Profile
              </a>
              <button
                onClick={() => onBookDoctor && onBookDoctor(activeDoctor)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition shadow-sm"
              >
                <span>Book Appointment</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
