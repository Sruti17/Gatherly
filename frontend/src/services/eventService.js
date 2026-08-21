import api from './api';

/*
 * ---------------------------------------------------------
 * NORMAL NEARBY EVENTS
 * ---------------------------------------------------------
 */
const getNearbyEvents = async ({
  latitude,
  longitude,
  city = '',
  area = '',
  query = '',
  page = 1,
}) => {
  const response = await api.get(
    '/events/nearby',
    {
      params: {
        latitude,
        longitude,
        city,
        area,
        query,
        page,
      },
    },
  );

  return response.data;
};

/*
 * ---------------------------------------------------------
 * EVENTBRITE-STYLE SEARCH
 * ---------------------------------------------------------
 *
 * Example:
 *
 * query   = tech events
 * country = India
 * city    = Bengaluru
 *
 * Spring will turn this into the Eventbrite
 * discovery URL.
 */
const searchEvents = async ({
  query,
  country = '',
  city = '',
  page = 1,
}) => {
  const response = await api.get(
    '/events/search',
    {
      params: {
        query,
        country,
        city,
        page,
      },
    },
  );

  return response.data;
};

/*
 * ---------------------------------------------------------
 * TRENDING EVENTS
 * ---------------------------------------------------------
 */
const getTrendingEvents = async ({
  city = 'Bengaluru',
  limit = 3,
} = {}) => {
  const response = await api.get(
    '/events/trending',
    {
      params: {
        city,
        limit,
      },
    },
  );

  return response.data;
};

/*
 * ---------------------------------------------------------
 * CREATE GATHERLY EVENT
 * ---------------------------------------------------------
 */
const createEvent = async (event) => {
  const response = await api.post(
    '/events',
    event,
  );

  return response.data;
};

/*
 * ---------------------------------------------------------
 * CREATED GATHERLY EVENTS
 * ---------------------------------------------------------
 */
const getCreatedEvents = async () => {
  const response = await api.get(
    '/events/created',
  );

  return response.data.events || [];
};

export default {
  getNearbyEvents,
  searchEvents,
  getTrendingEvents,
  createEvent,
  getCreatedEvents,
};