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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!place.trim()) return;

    setLoading(true);
    try {
      // 1. Geocode with Nominatim
      const nomRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { q: place, format: 'json', limit: 1 }
      });

      let latitude = 20.5937;
      let longitude = 78.9629;
      let foundPlace = false;

      if (nomRes.data.length > 0) {
        latitude = parseFloat(nomRes.data[0].lat);
        longitude = parseFloat(nomRes.data[0].lon);
        setMapCenter([latitude, longitude]);
        setZoom(13); // Zoom in closer
        foundPlace = true;
      } else {
        alert("Location coordinates not found. Try a simpler place name.");
        setLoading(false);
        return;
      }

      // 2. Fetch our system properties (instead of external Overpass data)
      const res = await propertyAPI.getAll();
      const allProps = res.data.properties || [];

      // Filter properties matching the searched place (by city or title)
      const searchStr = place.toLowerCase();
      const matched = allProps.filter(p => 
        p.address?.city?.toLowerCase().includes(searchStr) || 
        p.title?.toLowerCase().includes(searchStr)
      );

      // Generate slight random offsets for them (since our DB lacks lat/long)
      // This spreads them out around the searched city center
      const mappedMarkers = matched.map((p, index) => {
        // approx offset between -0.02 and +0.02 degrees (~2km radius)
        const latOffset = (Math.random() - 0.5) * 0.04; 
        const lonOffset = (Math.random() - 0.5) * 0.04;
        return {
          ...p,
          lat: latitude + latOffset,
          lon: longitude + lonOffset
        };
      });

      setMarkers(mappedMarkers);
      if (mappedMarkers.length === 0) {
        alert(`No available properties found in ${place} within our system.`);
      }

    } catch (err) {
      console.error(err);
      alert("Error fetching map data. Please check console.");
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
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', height: '600px', zIndex: 0, position: 'relative' }}>
        <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 1 }}>
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
