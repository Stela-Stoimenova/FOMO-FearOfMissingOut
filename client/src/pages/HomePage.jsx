// Home page — shows a welcome message and a list of upcoming events (static for now)
export default function HomePage() {
    return (
        <main className="page">
            <h1>Welcome to FOMO 🎵</h1>
            <p className="subtitle">Discover dance events, buy tickets, and never miss out.</p>

            <section className="event-grid">
                {/* Placeholder cards — will be replaced with real API data later */}
                {[
                    { id: 1, title: "Urban Salsa Night", location: "Sofia", price: "15.00 лв" },
                    { id: 2, title: "Hip-Hop Masterclass", location: "Sofia", price: "35.00 лв" },
                    { id: 3, title: "Bachata Social", location: "Plovdiv", price: "8.00 лв" },
                    { id: 4, title: "Kizomba Night", location: "Plovdiv", price: "10.00 лв" },
                    { id: 5, title: "Street Battle", location: "Varna", price: "5.00 лв" },
                    { id: 6, title: "Summer Festival", location: "Varna", price: "180.00 лв" },
                ].map((event) => (
                    <a key={event.id} href={`/events/${event.id}`} className="event-card">
                        <div className="event-card-img">🎶</div>
                        <div className="event-card-body">
                            <h3>{event.title}</h3>
                            <p>📍 {event.location}</p>
                            <p className="event-price">{event.price}</p>
                        </div>
                    </a>
                ))}
            </section>
        </main>
    );
}
