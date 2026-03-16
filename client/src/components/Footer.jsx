import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer style={{
            marginTop: 'auto',
            padding: '4rem 2rem 2rem',
            background: 'var(--bg-main)', // Blends directly into the background
            borderTop: '1px solid var(--border-light)',
            color: 'var(--text-muted)'
        }}>
            <div style={{
                maxWidth: 'var(--max-width)',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Link to="/" style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                        color: 'var(--text-main)',
                        textDecoration: 'none',
                        letterSpacing: '-0.02em',
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline-block'
                    }}>
                        FOMO
                    </Link>
                    <p style={{ lineHeight: 1.6, maxWidth: '300px' }}>
                        Curating the best dance events, workshops, and battles. Don't let the fear of missing out hold you back.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Tech Stack</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>React & Vite</li>
                        <li>Node.js & Express</li>
                        <li>PostgreSQL & Prisma</li>
                    </ul>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Links</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>
                            <Link to="/discover" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>Browse Dancers</Link>
                        </li>
                        <li>
                            <a href="https://github.com/Stela-Stoimenova/FOMO-FearOfMissingOut" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
                                GitHub Repository ↗
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div style={{
                maxWidth: 'var(--max-width)',
                margin: '3rem auto 0',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                fontSize: '0.85rem'
            }}>
                <span>&copy; {new Date().getFullYear()} FOMO. All rights reserved.</span>
                <span>Crafted for the Dance Community</span>
            </div>
        </footer>
    );
}
