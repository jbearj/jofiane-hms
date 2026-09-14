import React, { useEffect, useRef } from 'react';
import logo from '../../assets/Jofiane-logo.png';
import hotelImage from '../../assets/hotel-background.jpg';
import retreatImage from '../../assets/login-bg.jpg';
import './HotelHome.css';

const roomCollection = [
  { name: 'Garden Room', note: 'Room to slow down.', amenities: 'King-size bed · Smart TV', variant: 'garden' },
  { name: 'Veranda Suite', note: 'A little more room to unwind.', amenities: 'Private balcony · Wi-Fi · Mini bar', variant: 'veranda' },
  { name: 'Amber Loft', note: 'Your own quiet corner.', amenities: 'Private balcony · Smart TV', variant: 'amber' },
];

function Arrow({ direction = 'right' }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`hotel-arrow hotel-arrow-${direction}`}><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

function RoomIllustration({ variant }) {
  return (
    <div className={`hotel-room-art hotel-room-art-${variant}`} aria-hidden="true">
      <div className="hotel-room-window"><i /><i /><i /></div>
      <div className="hotel-room-lamp" />
      <div className="hotel-room-headboard" />
      <div className="hotel-room-bed"><span /><span /></div>
      <div className="hotel-room-bench" />
      <span className="hotel-room-art-label">THE JO FIANE COLLECTION</span>
    </div>
  );
}

export default function HotelHome({ isLoggedIn, expired, onReturn }) {
  const page = useRef(null);
  const rail = useRef(null);
  const title = useRef(null);

  useEffect(() => {
    document.title = 'Jo Fiane Hotel · A quieter kind of luxury';
    title.current?.focus({ preventScroll: true });
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    page.current?.querySelectorAll('[data-hotel-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const moveRooms = (direction) => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    rail.current?.scrollBy({ left: direction * (rail.current.clientWidth * 0.72), behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="hotel-home" ref={page}>
      <a className="hotel-skip-link" href="#hotel-introduction">Skip to hotel information</a>
      <header className="hotel-header">
        <a href="#hotel" className="hotel-brand" aria-label="Jo Fiane Hotel home"><img src={logo} alt="Jo Fiane Hotel" /></a>
        <nav aria-label="Hotel navigation"><a href="#hotel-introduction">The hotel</a><a href="#hotel-rooms">Our rooms</a><a href="#hotel-details">The details</a></nav>
        <button type="button" className="hotel-portal-button" onClick={onReturn}>Return to Employee Portal <Arrow /></button>
      </header>

      {expired && (
        <div className="hotel-session-notice" role="alert">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          <p>You have been logged out due to 30 minutes of inactivity for security purposes.</p>
          <button type="button" onClick={onReturn}>Sign in again <Arrow /></button>
        </div>
      )}

      <main>
        <section className="hotel-hero" aria-labelledby="hotel-heading">
          <div className="hotel-hero-image" style={{ backgroundImage: `url(${retreatImage})` }} />
          <div className="hotel-hero-shade" />
          <div className="hotel-light-orbit" aria-hidden="true" />
          <div className="hotel-hero-copy">
            <p className="hotel-eyebrow"><span /> WELCOME TO JO FIANE HOTEL</p>
            <h1 id="hotel-heading" tabIndex="-1" ref={title}>A quieter kind<br />of <em>luxury.</em></h1>
            <p className="hotel-hero-description">Space to settle in. Time to slow down.<br />Thoughtful hospitality, in every detail.</p>
            <a className="hotel-explore-link" href="#hotel-rooms">Explore the collection <span><Arrow direction="down" /></span></a>
          </div>
          <div className="hotel-hero-bottom">
            <span className="hotel-scroll-cue"><span /> SCROLL TO DISCOVER</span>
            <div className="hotel-welcome-note"><span className="hotel-welcome-mark">J.</span><p>A warm welcome.<br /><strong>A memorable stay.</strong></p><span className="hotel-note-line" /></div>
          </div>
        </section>

        <section className="hotel-introduction hotel-section" id="hotel-introduction" aria-labelledby="hotel-intro-heading">
          <div data-hotel-reveal>
            <p className="hotel-eyebrow">01 / THE JO FIANE EXPERIENCE</p>
            <h2 id="hotel-intro-heading">Some places invite you<br />to <em>stay a little longer.</em></h2>
          </div>
          <div className="hotel-intro-note" data-hotel-reveal><p>From your first welcome to your last goodnight, our team is here to help you feel at home.</p><p>Explore our room collection and the little comforts that make a stay your own.</p><a href="#hotel-details">It's all in the details <Arrow /></a></div>
        </section>

        <section className="hotel-rooms-section" id="hotel-rooms" aria-labelledby="hotel-rooms-heading">
          <div className="hotel-section-heading hotel-section" data-hotel-reveal>
            <div><p className="hotel-eyebrow">02 / FIND YOUR QUIET</p><h2 id="hotel-rooms-heading">Rooms with <em>character.</em></h2></div>
            <div className="hotel-rail-controls"><span>Discover the collection</span><button type="button" onClick={() => moveRooms(-1)} aria-label="Previous rooms"><Arrow direction="left" /></button><button type="button" onClick={() => moveRooms(1)} aria-label="Next rooms"><Arrow /></button></div>
          </div>
          <div className="hotel-room-rail" ref={rail} tabIndex="0" role="region" aria-label="Room collection. Scroll horizontally to explore.">
            {roomCollection.map((room, index) => (
              <article className="hotel-room-card" key={room.name}>
                <RoomIllustration variant={room.variant} />
                <div className="hotel-room-info"><span className="hotel-room-index">0{index + 1}</span><div><h3>{room.name}</h3><p>{room.note}</p><span className="hotel-room-amenities">{room.amenities}</span></div><Arrow /></div>
              </article>
            ))}
          </div>
          <p className="hotel-collection-caption">Illustrative room previews. Ask our front desk about room details and availability.</p>
        </section>

        <section className="hotel-details hotel-section" id="hotel-details" aria-labelledby="hotel-details-heading">
          <div className="hotel-details-image" data-hotel-reveal><img src={hotelImage} alt="The hotel's warmly illuminated exterior in the evening" loading="lazy" /><span>AFTER THE DAY, A WARM WELCOME.</span></div>
          <div className="hotel-details-copy" data-hotel-reveal>
            <p className="hotel-eyebrow">03 / CONSIDERED COMFORTS</p>
            <h2 id="hotel-details-heading">The little things.<br /><em>Beautifully considered.</em></h2>
            <div className="hotel-amenity"><span>01</span><div><h3>A space of your own</h3><p>From our Garden Room to our suites, find the right setting for your stay.</p></div></div>
            <div className="hotel-amenity"><span>02</span><div><h3>Everyday comforts</h3><p>Explore rooms with Wi-Fi, smart TVs, and private balconies. Amenities vary by room.</p></div></div>
            <div className="hotel-amenity"><span>03</span><div><h3>People who care</h3><p>Our front desk and housekeeping teams are here to make you feel welcome.</p></div></div>
          </div>
        </section>

        <section className="hotel-closing hotel-section" data-hotel-reveal>
          <p className="hotel-eyebrow">JO FIANE HOTEL</p>
          <h2>A place to return to.<br /><em>A welcome to remember.</em></h2>
          <a href="#hotel">Back to the beginning <Arrow direction="up" /></a>
        </section>
      </main>
      <footer className="hotel-footer"><img src={logo} alt="Jo Fiane Hotel" /><span>Thoughtful stays. Lasting impressions.</span><button type="button" onClick={onReturn}>{isLoggedIn ? 'Resume your workspace' : 'Employee sign in'} <Arrow /></button></footer>
    </div>
  );
}
