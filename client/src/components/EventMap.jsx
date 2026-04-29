import { useState, useMemo, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Link } from 'react-router-dom';

function formatPrice(cents) {
    if (!cents && cents !== 0) return 'Free';
    return `€${(cents / 100).toFixed(2)}`;
}

export default function EventMap({ events, userLocation, nearbyEventIds = [] }) {
    const [popupInfo, setPopupInfo] = useState(null);
    const mapRef = useRef(null);
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    const initialViewState = {
        longitude: 12.0,
        latitude: 48.0,
        zoom: 3.5
    };

    useEffect(() => {
        if (userLocation && mapRef.current) {
            mapRef.current.flyTo({
                center: [userLocation.longitude, userLocation.latitude],
                zoom: 11,
                duration: 2000,
                essential: true
            });
        }
    }, [userLocation]);

    const markers = useMemo(() =>
        events
            .filter(e => e.latitude && e.longitude)
            .map((event) => {
                const isNearby = nearbyEventIds.includes(event.id);
                return (
                    <Marker
                        key={event.id}
                        longitude={event.longitude}
                        latitude={event.latitude}
                        anchor="bottom"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            setPopupInfo(event);
                        }}
                    >
                        <div style={{
                            width: isNearby ? '32px' : '24px',
                            height: isNearby ? '32px' : '24px',
                            background: isNearby ? 'var(--success)' : 'var(--primary)',
                            borderRadius: '50%',
                            border: '3px solid var(--bg-card)',
                            boxShadow: isNearby ? '0 0 15px var(--success)' : '0 0 10px rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    </Marker>
                );
            }), [events, nearbyEventIds]);

    if (!MAPBOX_TOKEN || MAPBOX_TOKEN.length < 20) {
        return (
            <div style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🌍</div>
                <h3 style={{ margin: '0 0 0.75rem 0', fontFamily: 'var(--font-display)' }}>Map Not Configured</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '350px', lineHeight: 1.6 }}>
                    Your Mapbox token is missing or invalid. Please check <code>client/.env</code> and ensure <code>VITE_MAPBOX_TOKEN</code> is set correctly.
                </p>
                <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', opacity: 0.5 }}>
                    Token starts with: {MAPBOX_TOKEN ? MAPBOX_TOKEN.substring(0, 10) + '...' : 'None'}
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <Map
                ref={mapRef}
                initialViewState={initialViewState}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
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
                                {popupInfo.location}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                                    {formatPrice(popupInfo.priceCents)}
                                </span>
                                <Link
                                    to={`/events/${popupInfo.id}`}
                                    style={{ background: 'var(--primary)', color: 'white', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
                                >
                                    Details
                                </Link>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}
