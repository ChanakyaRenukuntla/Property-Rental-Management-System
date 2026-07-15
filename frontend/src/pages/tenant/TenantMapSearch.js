// src/pages/tenant/TenantMapSearch.js

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import { propertyAPI, requestAPI } from '../../services/api';

// Import leaflet CSS and default icons for CRA bundle
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet marker icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// Bounding box that covers all of India (SW, NE corners)
const INDIA_BOUNDS = [
  [6.5, 68.0],
  [37.5, 97.5]
];

// Fallback location used when a searched place can't be found
const HYDERABAD = { name: 'Hyderabad', lat: 17.385, lon: 78.4867 };

// Component to dynamically recenter map
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function TenantMapSearch() {
  const [place, setPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center default
  const [zoom, setZoom] = useState(5);
  const [notice, setNotice] = useState('');

  const plotPropertiesAround = async (latitude, longitude, cityFilter) => {
    const res = await propertyAPI.getAll();
    const allProps = res.data.properties || [];

    const searchStr = cityFilter.toLowerCase();
    const matched = allProps.filter(p =>
      p.address?.city?.toLowerCase().includes(searchStr) ||
      p.title?.toLowerCase().includes(searchStr)
    );

    // Generate slight random offsets for them (since our DB lacks lat/long)
    // This spreads them out around the city center
    const mappedMarkers = matched.map(p => {
      const latOffset = (Math.random() - 0.5) * 0.04;
      const lonOffset = (Math.random() - 0.5) * 0.04;
      return { ...p, lat: latitude + latOffset, lon: longitude + lonOffset };
    });

    setMarkers(mappedMarkers);
    return mappedMarkers.length;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!place.trim()) return;

    setLoading(true);
    setNotice('');
    try {
      // Restrict geocoding to India only, so a name that also exists abroad
      // (e.g. a same-named town in Pakistan) can't be matched by mistake.
      const nomRes = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: place, format: 'json', limit: 1, countrycodes: 'in' }
      });

      if (nomRes.data.length === 0) {
        // Fallback: couldn't find the place — show Hyderabad area properties instead
        setMapCenter([HYDERABAD.lat, HYDERABAD.lon]);
        setZoom(12);
        const count = await plotPropertiesAround(HYDERABAD.lat, HYDERABAD.lon, HYDERABAD.name);
        setNotice(
          count > 0
            ? `Couldn't find "${place}" in India — showing Hyderabad area properties instead.`
            : `Couldn't find "${place}" in India, and no Hyderabad properties are available either.`
        );
        setLoading(false);
        return;
      }

      const latitude = parseFloat(nomRes.data[0].lat);
      const longitude = parseFloat(nomRes.data[0].lon);
      setMapCenter([latitude, longitude]);
      setZoom(13);

      const count = await plotPropertiesAround(latitude, longitude, place);
      if (count === 0) {
        setNotice(`No available properties found in ${place} within our system.`);
      }
    } catch (err) {
      console.error(err);
      setNotice('Error fetching map data. Please check console.');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Map Search</h1>
          <p className="page-subtitle">Pots your available PGs, Hostels, and Villas on the map</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, minWidth: '200px' }}
            placeholder="Search city to view our properties (e.g. 'Pune' or 'Mumbai')"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search on Map'}
          </button>
        </form>
        {notice && <p style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 10 }}>⚠️ {notice}</p>}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', height: '600px', zIndex: 0, position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          minZoom={5}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <ChangeView center={mapCenter} zoom={zoom} />
          <TileLayer
            attribution='&amp;copy <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((prop) => (
            <Marker key={prop._id} position={[prop.lat, prop.lon]}>
              <Popup>
                <div style={{ fontFamily: 'var(--font)', color: 'var(--text)' }}>
                  <h3 style={{ fontSize: '15px', marginBottom: '5px', fontWeight: 700 }}>
                    {prop.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    <b>Type:</b> <span style={{textTransform:'capitalize'}}>{prop.type}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    <b>Rent:</b> ₹{prop.rent?.toLocaleString()} / month
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                    📍 {prop.address?.street}, {prop.address?.city}
                  </div>
                  <div style={{ display:'flex', gap: '5px', marginTop: '12px' }}>
                    <span className={`badge badge-${prop.status==='available'?'green':'amber'}`}>{prop.status}</span>
                    {prop.status === 'available' && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent:'center' }}
                        onClick={async () => {
                          const userMsg = window.prompt("Optional: Add a message for the owner", "I am interested in this property from the map search.");
                          if (userMsg === null) return; // User cancelled
                          try {
                            await requestAPI.create({
                              propertyId: prop._id,
                              message: userMsg
                            });
                            alert(`Booking request sent successfully to the owner of ${prop.title}!`);
                          } catch (err) {
                            alert(err.response?.data?.message || 'Error sending request.');
                          }
                        }}
                      >
                        Request to Book
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
