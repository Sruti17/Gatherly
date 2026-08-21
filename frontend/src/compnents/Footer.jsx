import React from 'react';

const footerColumns = [
  {
    title: 'Use Gatherly',
    links: ['Create Events', 'Pricing', 'Event Marketing Platform', 'Gatherly Mobile App', 'Gatherly Check-In App', 'Gatherly App Marketplace', 'Event Registration Software', 'Community Guidelines', 'FAQs', 'Sitemap'],
  },
  {
    title: 'Plan Events',
    links: ['Sell Tickets Online', 'Performing Arts Ticketing Software', 'Sell Concert Tickets Online', 'Event Payment System', 'Solutions for Professional Services', 'Event Management Software', 'Halloween Party Planning', 'Virtual Events Platform', 'QR Codes for Event Check-In', 'Post your event online'],
  },
  {
    title: 'Find Events',
    links: ['New Orleans Food & Drink Events', 'San Francisco Holiday Events', 'Tulum Music Events', 'Denver Hobby Events', 'Atlanta Pop Music Events', 'New York Events', 'Chicago Events', 'Events in Dallas Today', 'Los Angeles Events', 'Washington Events'],
  },
  {
    title: 'Connect With Us',
    links: ['Contact Support', 'Contact Sales', 'X', 'Facebook', 'LinkedIn', 'Instagram', 'TikTok'],
  },
];

function Footer() {
  return (
    <footer className="gatherly-footer mt-12 px-5 py-8 lg:px-8 lg:py-9">
      <div className="gatherly-footer-grid mx-auto max-w-[1400px]">
        {footerColumns.map((column) => (
          <section key={column.title}>
            <h2>{column.title}</h2>
            <nav aria-label={column.title}>
              {column.links.map((link) => (
                <a href="#" key={link}>{link}</a>
              ))}
            </nav>
          </section>
        ))}
      </div>
    </footer>
  );
}

export default Footer;