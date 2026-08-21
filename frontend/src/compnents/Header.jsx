import React, { useState } from 'react';
import { Search, MapPin, Bell, CircleHelp, Plus } from 'lucide-react';

const locations = {
  India: {
    Bengaluru: ['Whitefield', 'Indiranagar', 'Koramangala', 'Electronic City', 'HSR Layout', 'Marathahalli', 'Jayanagar', 'Yeshwanthpur'],
    Mumbai: ['Andheri', 'Bandra', 'Powai', 'Colaba', 'Dadar', 'Goregaon', 'Juhu', 'Lower Parel'],
    Delhi: ['Connaught Place', 'Dwarka', 'Saket', 'Rohini', 'Vasant Kunj', 'Hauz Khas', 'Karol Bagh', 'Lajpat Nagar'],
    Hyderabad: ['Gachibowli', 'Hitech City', 'Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Kondapur', 'Secunderabad'],
    Chennai: ['T. Nagar', 'Adyar', 'Anna Nagar', 'Velachery', 'Guindy', 'Nungambakkam', 'OMR'],
    Kolkata: ['Salt Lake', 'New Town', 'Park Street', 'Ballygunge', 'Alipore', 'Howrah', 'Dum Dum'],
    Pune: ['Hinjewadi', 'Koregaon Park', 'Kothrud', 'Viman Nagar', 'Baner', 'Wakad', 'Aundh'],
    Ahmedabad: ['Navrangpura', 'Satellite', 'Bodakdev', 'Vastrapur', 'Maninagar', 'Chandkheda', 'Prahlad Nagar'],
    Jaipur: ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Mansarovar', 'Raja Park', 'Jagatpura'],
    Surat: ['Adajan', 'Vesu', 'Varachha', 'Athwa', 'Pal', 'Piplod'],
    Kochi: ['Kakkanad', 'Edappally', 'Fort Kochi', 'Vyttila', 'Marine Drive', 'Aluva'],
    Chandigarh: ['Sector 17', 'Sector 22', 'Sector 35', 'Manimajra', 'Zirakpur', 'Mohali'],
    Lucknow: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Alambagh', 'Mahanagar'],
    Bhopal: ['Arera Colony', 'MP Nagar', 'Kolar Road', 'Shahpura', 'Bawadia Kalan'],
    Indore: ['Vijay Nagar', 'Rau', 'Palasia', 'Bhawarkua', 'Scheme 78', 'Rajendra Nagar'],
    Nagpur: ['Dharampeth', 'Sadar', 'Manish Nagar', 'Wardha Road', 'Besa', 'Civil Lines'],
    Visakhapatnam: ['Madhurawada', 'MVP Colony', 'Dwaraka Nagar', 'Gajuwaka', 'Rushikonda'],
    Bhubaneswar: ['Patia', 'Saheed Nagar', 'Khandagiri', 'Nayapalli', 'Old Town'],
    Coimbatore: ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Saravanampatti', 'Singanallur'],
    Mysuru: ['Vijayanagar', 'Kuvempunagar', 'Hebbal', 'Saraswathipuram', 'Jayalakshmipuram'],
    Mangaluru: ['Kadri', 'Bejai', 'Kankanady', 'Hampankatta', 'Surathkal'],
    Hoskote: ['Old Town', 'Malur Road', 'Budigere Cross', 'Nandagudi'],
  },
  'United States': {
    'New York': ['Manhattan', 'Brooklyn', 'Queens'],
    'Los Angeles': ['Hollywood', 'Santa Monica', 'Venice'],
    Chicago: ['The Loop', 'Lincoln Park', 'Hyde Park'],
  },
  'United Kingdom': {
    London: ['Camden', 'Chelsea', 'Greenwich'],
    Manchester: ['City Centre', 'Salford', 'Didsbury'],
    Edinburgh: ['Old Town', 'Leith', 'New Town'],
  },
};

function Header({ currentUser, onLogin, onLogout, onSearch, onLocationChange, onCreateEvent }) {
  const [searchText, setSearchText] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const cities = country ? Object.keys(locations[country]) : [];
  const areas = country && city ? locations[country][city] : [];

  const handleCountryChange = (event) => {
    const nextCountry = event.target.value;
    setCountry(nextCountry);
    setCity('');
    setArea('');
    onLocationChange({ country: nextCountry, city: '', area: '' });
  };

  const handleCityChange = (event) => {
    const nextCity = event.target.value;
    setCity(nextCity);
    setArea('');
    onLocationChange({ country, city: nextCity, area: '' });
  };

  return (
    <header className="gatherly-nav sticky top-0 z-50 flex items-center justify-between border-b-2 border-[#d7d2ee] bg-white px-4 py-2 lg:px-7">
      <div className="flex shrink-0 items-center">
        <span className="gatherly-logo">Gatherly</span>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); onSearch(searchText); }} className="gatherly-search mx-4 hidden h-10 min-w-0 flex-1 items-center md:flex">
        <div className="relative flex min-w-0 flex-1 items-center">
          <input
            type="search"
            placeholder="Search events..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="h-full min-w-0 w-full rounded-l-full bg-transparent pl-4 pr-2 text-sm outline-none placeholder:text-gray-500"
          />
        </div>
        <div className="location-filters flex h-7 shrink-0 items-center gap-1 border-l border-[#d9d3e7] px-2 text-sm text-gray-800">
          <MapPin className="size-4 text-[#5d3baa]" />
          <select value={country} onChange={handleCountryChange} aria-label="Country" className="location-select">
            <option value="">Country</option>
            {Object.keys(locations).map((countryName) => <option key={countryName} value={countryName}>{countryName}</option>)}
          </select>
          <select value={city} onChange={handleCityChange} disabled={!country} aria-label="City" className="location-select">
            <option value="">City</option>
            {cities.map((cityName) => <option key={cityName} value={cityName}>{cityName}</option>)}
          </select>
          <select value={area} onChange={(event) => { setArea(event.target.value); onLocationChange({ country, city, area: event.target.value }); }} disabled={!city} aria-label="Area" className="location-select location-area-select">
            <option value="">Area</option>
            {areas.map((areaName) => <option key={areaName} value={areaName}>{areaName}</option>)}
          </select>
        </div>
        <button type="submit" aria-label="Search" className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#6329a9] text-white shadow-[0_0_10px_#bcb0ff] hover:bg-[#351080]">
          <Search className="size-4" />
        </button>
      </form>

      <div className="flex shrink-0 items-center gap-2 text-sm text-gray-800">
        {currentUser && (
          <button type="button" title="Notifications" aria-label="Notifications" className="gatherly-nav-icon">
            <Bell className="size-4" />
            <span className="gatherly-nav-label">Notifications</span>
          </button>
        )}
        <button type="button" title="Help Center" aria-label="Help Center" className="gatherly-nav-icon">
          <CircleHelp className="size-4" />
          <span className="gatherly-nav-label">Help Center</span>
        </button>
        {currentUser && (
          <button type="button" onClick={onCreateEvent} title="Create an Event" aria-label="Create an Event" className="gatherly-create-event">
            <Plus className="size-4" />
            <span className="gatherly-nav-label">Create an Event</span>
          </button>
        )}
        {currentUser ? (
          <>
            <span className="gatherly-profile-name" title={currentUser.email}>Hi, {currentUser.name}</span>
            <button type="button" onClick={onLogout} className="gatherly-nav-icon font-semibold text-[#57378e]" title="Log out">
              LOGOUT
            </button>
          </>
        ) : (
          <button type="button" onClick={onLogin} className="gatherly-glow-button whitespace-nowrap px-4 py-2 text-sm font-bold text-[#241455]">
            LOGIN
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;