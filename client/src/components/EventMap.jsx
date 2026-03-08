import { useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Link } from 'react-router-dom';

// We format the price cleanly
function formatPrice(cents) {
    if (!cents && cents !== 0) return 'Free';
    return `€${(cents / 100).toFixed(2)}`;
}

export default function EventMap({ events }) {
    const [popupInfo, setPopupInfo] = useState(null);

    // Initial View State centers roughly around Europe
    const initialViewState = {
        longitude: 12.0,
        latitude: 48.0,
        zoom: 3.5
    };

    // We use useMemo to prevent re-rendering all markers every time a popup opens/closes
    const markers = useMemo(() =>
        events
            .filter(e => e.latitude && e.longitude) // Only plot physical ones
            .map((event) => (
                <Marker
                    key={event.id}
                    longitude={event.longitude}
                    latitude={event.latitude}
                    anchor="bottom"
                    onClick={(e) => {
                        // If we let the click propagate, it might close the popup immediately
                        e.originalEvent.stopPropagation();
                        setPopupInfo(event);
                    }}
                >
                    {/* A custom elegant map marker */}
                    <div style={{
                        width: '24px',
                        height: '24px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        border: '3px solid var(--bg-card)',
                        boxShadow: '0 0 10px rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                </Marker>
            )), [events]);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <Map

                initialViewState={initialViewState}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            >
                <NavigationControl position="top-right" />

                {markers}

                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={Number(popupInfo.longitude)}
                        latitude={Number(popupInfo.latitude)}
                        onClose={() => setPopupInfo(null)}
                        closeButton={false}
                        maxWidth="300px"
                    >
                        <div style={{ padding: '0.5rem', fontFamily: 'var(--font-sans)', color: 'var(--text-main)' }}>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
                                {popupInfo.title}
                            </h4>
                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                📍 {popupInfo.location}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                                    {formatPrice(popupInfo.priceCents)}
                                </span>
                                <Link
                                    to={`/events/${popupInfo.id}`}
                                    style={{ background: 'var(--primary)', color: 'var(--bg-card)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
                                >
                                    View
                                </Link>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}
