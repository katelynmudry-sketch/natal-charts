import { isTodoValue, type EventConfig } from '../lib/event';

export default function Booking({ event }: { event: EventConfig }) {
  const hosts = event.hosts.filter((h) => !isTodoValue(h.bookingUrl));
  if (hosts.length === 0) return null;
  return (
    <section className="card wide no-print">
      <h3>Book a session</h3>
      <div className="hosts">
        {hosts.map((h) => (
          <div key={h.name}>
            <p className="big">{h.name}</p>
            {!isTodoValue(h.blurb) && <p className="blurb">{h.blurb}</p>}
            <a className="btn" href={h.bookingUrl} target="_blank" rel="noreferrer">Book with {h.name}</a>
          </div>
        ))}
      </div>
    </section>
  );
}
