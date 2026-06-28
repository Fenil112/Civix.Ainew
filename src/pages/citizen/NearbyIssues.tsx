import { useEffect, useRef, useState, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Complaint } from '../../types';
import { MapPin, List } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

const SEVERITY_COLORS = {
  low: '#34d399',
  medium: '#fbbf24',
  high: '#f97316',
  critical: '#f87171',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Road & Infrastructure': '🛣️',
  'Water & Sanitation': '💧',
  'Electricity': '⚡',
  'Public Safety': '🚨',
  'Garbage & Waste': '🗑️',
  'Parks & Recreation': '🌳',
  'Noise Pollution': '🔊',
  'Air Quality': '💨',
  'Public Transport': '🚌',
  'Buildings & Construction': '🏗️',
  'Other': '📍',
};

export default function NearbyIssues() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const markersRef = useRef<any[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(!!window.google);

  useEffect(() => {
    if (window.google) return;
    const interval = setInterval(() => {
      if (window.google) {
        setMapsLoaded(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
        timeline: [],
      })) as any as Complaint[];
      setComplaints(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching nearby complaints:', error);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.google || map) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 }, // India center
      zoom: 5,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
      mapTypeControl: false,
      streetViewControl: false,
    });

    setMap(googleMap);
  }, [mapsLoaded, complaints]);

  useEffect(() => {
    if (!map || !complaints.length) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const filtered = complaints.filter((c) => {
      const locValid = c.location?.lat && c.location?.lng;
      const sevMatch = filterSeverity === 'all' || c.severity === filterSeverity;
      const catMatch = filterCategory === 'all' || c.category === filterCategory;
      return locValid && sevMatch && catMatch;
    });

    filtered.forEach((complaint) => {
      const marker = new window.google.maps.Marker({
        position: { lat: complaint.location.lat, lng: complaint.location.lng },
        map,
        title: complaint.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: SEVERITY_COLORS[complaint.severity] || '#94a3b8',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 1.5,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="background:#1e293b;color:#f1f5f9;padding:12px;border-radius:8px;max-width:220px;font-family:Inter,sans-serif">
            <p style="font-weight:600;font-size:13px;margin:0 0 4px">${complaint.title}</p>
            <p style="font-size:11px;color:#94a3b8;margin:0 0 8px">${complaint.category}</p>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="background:${SEVERITY_COLORS[complaint.severity]}22;color:${SEVERITY_COLORS[complaint.severity]};padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;text-transform:capitalize">${complaint.severity}</span>
              <span style="font-size:10px;color:#64748b">${complaint.status}</span>
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  }, [map, complaints, filterSeverity, filterCategory]);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const sevMatch = filterSeverity === 'all' || c.severity === filterSeverity;
      const catMatch = filterCategory === 'all' || c.category === filterCategory;
      return sevMatch && catMatch;
    });
  }, [complaints, filterSeverity, filterCategory]);

  const categories = useMemo(() => {
    return [...new Set(complaints.map((c) => c.category))];
  }, [complaints]);

  return (
    <DashboardLayout role="citizen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Nearby Issues</h1>
            <p className="text-slate-500 text-sm mt-1">{filtered.length} issues found</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                view === 'map' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'glass text-slate-500 hover:text-slate-300'
              }`}
            >
              <MapPin className="w-4 h-4" /> Map
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                view === 'list' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'glass text-slate-500 hover:text-slate-300'
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="input-dark rounded-xl px-4 py-2 text-sm"
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-dark rounded-xl px-4 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Legend */}
          <div className="flex items-center gap-3 ml-auto">
            {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
              <div key={sev} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-500 capitalize">{sev}</span>
              </div>
            ))}
          </div>
        </div>

        {view === 'map' ? (
          <div className="relative glass rounded-2xl overflow-hidden" style={{ height: 600 }}>
            <div ref={mapRef} className="w-full h-full" />
            {!window.google && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Loading Google Maps...</p>
                  <p className="text-slate-600 text-sm mt-1">Please configure your Google Maps API key</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2, 4].map((i) => <div key={i} className="glass rounded-xl p-4 skeleton h-28" />)
            ) : filtered.slice(0, 50).map((c) => (
              <div key={c.id} className="glass rounded-xl p-4 border border-white/5 hover:border-indigo-500/20 transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[c.category] || '📍'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{c.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{c.location?.address || 'No address'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-md capitalize"
                        style={{ backgroundColor: SEVERITY_COLORS[c.severity] + '22', color: SEVERITY_COLORS[c.severity] }}>
                        {c.severity}
                      </span>
                      <span className="text-xs text-slate-600">{c.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
