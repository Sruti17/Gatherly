import React, {
  useEffect,
  useState,
} from 'react';

import {
  motion,
} from 'framer-motion';

import {
  Pencil,
  Users,
} from 'lucide-react';

import eventService
  from '../services/eventService';


/*
 * =========================================================
 * EVENT CARD
 * =========================================================
 *
 * IMPORTANT LOGIN BEHAVIOR:
 *
 * Not logged in:
 *      open Gatherly login modal
 *
 * Logged in:
 *      open the exact Eventbrite URL
 */
function EventCard({
  image,
  date,
  title,
  venue,
  attendees,
  url,
  index,
  currentUser,
  onRequireLogin,
}) {

  const handleEventClick =
    (event) => {

      /*
       * Prevent the <a> element from navigating
       * until authentication has been checked.
       */
      event.preventDefault();


      /*
       * ---------------------------------------------------
       * USER NOT LOGGED IN
       * ---------------------------------------------------
       */
      if (!currentUser) {

        onRequireLogin?.();

        return;
      }


      /*
       * ---------------------------------------------------
       * USER IS LOGGED IN
       * ---------------------------------------------------
       *
       * Open the exact Eventbrite URL returned by
       * your backend.
       */
      if (url) {

        window.open(
          url,
          '_blank',
          'noopener,noreferrer',
        );

        return;
      }


      /*
       * Gatherly-created events may not have an
       * Eventbrite URL. For now we simply do nothing.
       *
       * Later you can open an internal Event Details page.
       */
      console.log(
        'This Gatherly event has no external URL:',
        title,
      );
    };


  return (

    <motion.a

      href={
        url || '#'
      }

      onClick={
        handleEventClick
      }

      whileHover={{
        y: -12,

        rotateX:
          5,

        rotateY:
          index % 2
            ? -5
            : 5,

        scale:
          1.025,
      }}

      transition={{
        type:
          'spring',

        stiffness:
          260,

        damping:
          18,
      }}

      className={
        `gatherly-event-card gatherly-event-card-${index + 1} flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-[#ceb6ef] bg-white transition-shadow`
      }

      aria-label={
        currentUser
          ? `Open ${title}`
          : `Log in to open ${title}`
      }
    >

      {/* EVENT IMAGE */}

      <div
        className="relative h-24 overflow-hidden"
      >

        <img

          src={
            image
            ||
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80'
          }

          alt={
            title
          }

          className="h-full w-full object-cover"
        />

      </div>


      {/* EVENT INFORMATION */}

      <div
        className="flex-grow p-2"
      >

        <p
          className="text-[9px] font-medium text-gray-600"
        >
          {date}
        </p>


        <h3
          className="mt-0.5 text-xs font-bold leading-tight text-gray-900"
        >
          {title}
        </h3>


        {venue && (

          <p
            className="mt-1 truncate text-[10px] text-gray-500"
          >
            {venue}
          </p>

        )}

      </div>


      {/* CARD FOOTER */}

      <div
        className="flex items-center justify-end gap-1 border-t border-gray-100 px-2 py-1 text-gray-500"
      >

        <Users
          className="size-3"
        />


        <span
          className="text-[9px] font-semibold"
        >

          {
            attendees
            ||
            'Join'
          }

          {
            attendees
              ? ' going'
              : ''
          }

        </span>

      </div>

    </motion.a>
  );
}


/*
 * =========================================================
 * EVENT GRID
 * =========================================================
 */
function EventGridSection({

  searchQuery = '',

  selectedLocation = {},

  createdEvents = [],

  /*
   * NEW:
   *
   * User currently authenticated in App.jsx
   */
  currentUser = null,

  /*
   * NEW:
   *
   * Opens LoginModal from App.jsx.
   */
  onRequireLogin,

}) {

  const [
    location,
    setLocation,
  ] = useState({
    label:
      'your location',

    status:
      'loading',
  });


  const [
    nearbyEvents,
    setNearbyEvents,
  ] = useState(
    [],
  );


  const [
    isLoadingEvents,
    setIsLoadingEvents,
  ] = useState(
    true,
  );


  const [
    isLoadingMore,
    setIsLoadingMore,
  ] = useState(
    false,
  );


  const [
    hasMoreEvents,
    setHasMoreEvents,
  ] = useState(
    false,
  );


  const [
    eventPage,
    setEventPage,
  ] = useState(
    1,
  );


  const [
    eventCoordinates,
    setEventCoordinates,
  ] = useState({

    latitude:
      0,

    longitude:
      0,

    country:
      '',

    city:
      '',

    area:
      '',
  });


  const [
    eventsError,
    setEventsError,
  ] = useState(
    '',
  );


  const normalizedSearchQuery =
    searchQuery.trim();


  /*
   * =========================================================
   * FETCH PUBLIC EVENTS
   * =========================================================
   */
  const fetchEvents =
    async ({

      latitude = 0,

      longitude = 0,

      country = '',

      city = '',

      area = '',

      page = 1,

      append = false,

      query =
        normalizedSearchQuery,

    }) => {

      if (append) {

        setIsLoadingMore(
          true,
        );

      } else {

        setIsLoadingEvents(
          true,
        );
      }


      try {

        let result;


        /*
         * -------------------------------------------------
         * SEARCH MODE
         * -------------------------------------------------
         */
        if (
          query.trim()
        ) {

          result =
            await eventService
              .searchEvents({

                query,

                country,

                city,

                page,

              });

        }


        /*
         * -------------------------------------------------
         * NEARBY MODE
         * -------------------------------------------------
         */
        else {

          result =
            await eventService
              .getNearbyEvents({

                latitude,

                longitude,

                city,

                area,

                query:
                  '',

                page,

              });
        }


        const events =
          Array.isArray(
            result,
          )

            ? result

            : result
                ?.events
              || [];


        setNearbyEvents(
          (
            current,
          ) =>

            append

              ? [
                  ...current,
                  ...events,
                ]

              : events,
        );


        setHasMoreEvents(

          !Array.isArray(
            result,
          )

          &&

          Boolean(
            result
              ?.hasMore,
          ),
        );


        setEventPage(
          page,
        );


        setEventCoordinates({

          latitude,

          longitude,

          country,

          city,

          area,

        });


        setEventsError(
          '',
        );

      } catch (
        error
      ) {

        console.error(
          'Unable to load events:',
          error,
        );


        if (
          !append
        ) {

          setNearbyEvents(
            [],
          );
        }


        setEventsError(

          normalizedSearchQuery

            ? `Unable to search events for "${normalizedSearchQuery}" right now.`

            : 'Unable to load public events for this city right now.',
        );

      } finally {

        if (
          !append
        ) {

          setIsLoadingEvents(
            false,
          );
        }


        setIsLoadingMore(
          false,
        );
      }
    };


  /*
   * =========================================================
   * LOCATION
   * =========================================================
   */
  useEffect(
    () => {

      let cancelled =
        false;


      const loadEvents =
        async () => {

          const selectedCountry =
            selectedLocation
              .country
            || '';


          const selectedCity =
            selectedLocation
              .city
            || '';


          const selectedArea =
            selectedLocation
              .area
            || '';


          /*
           * -------------------------------------------------
           * MANUALLY SELECTED CITY
           * -------------------------------------------------
           */
          if (
            selectedCity
          ) {

            const selectedLabel =
              [

                selectedArea,

                selectedCity,

                selectedCountry,

              ]

                .filter(
                  Boolean,
                )

                .join(
                  ', ',
                );


            setLocation({

              label:
                selectedLabel,

              status:
                'loading',

            });


            try {

              const geocodeQuery =
                [

                  selectedArea,

                  selectedCity,

                  selectedCountry,

                ]

                  .filter(
                    Boolean,
                  )

                  .join(
                    ', ',
                  );


              const response =
                await fetch(

                  `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(
                    geocodeQuery,
                  )}`,

                );


              if (
                !response.ok
              ) {

                throw new Error(
                  `Location lookup failed: ${response.status}`,
                );
              }


              const results =
                await response.json();


              if (
                cancelled
              ) {

                return;
              }


              if (
                !results.length
              ) {

                setLocation({

                  label:
                    selectedLabel,

                  status:
                    'unavailable',

                });


                setNearbyEvents(
                  [],
                );


                setEventsError(
                  `Could not locate ${selectedLabel}.`,
                );


                setIsLoadingEvents(
                  false,
                );


                return;
              }


              const latitude =
                Number(
                  results[0]
                    .lat,
                );


              const longitude =
                Number(
                  results[0]
                    .lon,
                );


              setLocation({

                label:
                  selectedLabel,

                status:
                  'ready',

              });


              await fetchEvents({

                latitude,

                longitude,

                country:
                  selectedCountry,

                city:
                  selectedCity,

                area:
                  selectedArea,

                page:
                  1,

                append:
                  false,

                query:
                  normalizedSearchQuery,

              });


            } catch (
              error
            ) {

              console.error(
                'Selected location lookup failed:',
                error,
              );


              if (
                !cancelled
              ) {

                setLocation({

                  label:
                    selectedLabel,

                  status:
                    'unavailable',

                });


                setNearbyEvents(
                  [],
                );


                setEventsError(
                  `Unable to locate ${selectedLabel}.`,
                );


                setIsLoadingEvents(
                  false,
                );
              }
            }


            return;
          }


          /*
           * -------------------------------------------------
           * COUNTRY ONLY
           * -------------------------------------------------
           */
          if (
            selectedCountry
            &&
            !selectedCity
            &&
            !normalizedSearchQuery
          ) {

            setLocation({

              label:
                selectedCountry,

              status:
                'ready',

            });


            setNearbyEvents(
              [],
            );


            setHasMoreEvents(
              false,
            );


            setEventsError(
              `Select a city in ${selectedCountry} to see nearby events.`,
            );


            setIsLoadingEvents(
              false,
            );


            return;
          }


          /*
           * -------------------------------------------------
           * BROWSER GEOLOCATION
           * -------------------------------------------------
           */
          if (
            !navigator.geolocation
          ) {

            setLocation({

              label:
                'your location',

              status:
                'unavailable',

            });


            setEventsError(
              'Location services are not supported by your browser.',
            );


            setIsLoadingEvents(
              false,
            );


            return;
          }


          navigator
            .geolocation
            .getCurrentPosition(

              async ({
                coords,
              }) => {

                if (
                  cancelled
                ) {

                  return;
                }


                let label =
                  'your location';


                let city =
                  '';


                let country =
                  selectedCountry
                  || '';


                try {

                  const response =
                    await fetch(

                      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=10&accept-language=en&lat=${coords.latitude}&lon=${coords.longitude}`,

                    );


                  const data =
                    await response.json();


                  const address =
                    data.address
                    || {};


                  city =

                    address.city

                    ||

                    address.town

                    ||

                    address.village

                    ||

                    address.municipality

                    ||

                    address.city_district

                    ||

                    address.state_district

                    ||

                    address.county

                    ||

                    address.state

                    ||

                    '';


                  country =

                    selectedCountry

                    ||

                    address.country

                    ||

                    '';


                  label =

                    address.city

                    ||

                    address.town

                    ||

                    address.village

                    ||

                    address.municipality

                    ||

                    address.city_district

                    ||

                    address.state_district

                    ||

                    address.county

                    ||

                    address.state

                    ||

                    'your location';


                } catch (
                  error
                ) {

                  console.error(
                    'Reverse geocoding failed:',
                    error,
                  );
                }


                if (
                  cancelled
                ) {

                  return;
                }


                setLocation({

                  label,

                  status:
                    'ready',

                });


                await fetchEvents({

                  latitude:
                    coords.latitude,

                  longitude:
                    coords.longitude,

                  country,

                  city,

                  area:
                    '',

                  page:
                    1,

                  append:
                    false,

                  query:
                    normalizedSearchQuery,

                });

              },


              () => {

                if (
                  !cancelled
                ) {

                  setLocation({

                    label:
                      'your location',

                    status:
                      'denied',

                  });


                  setEventsError(
                    'Please allow location access or select a city manually.',
                  );


                  setIsLoadingEvents(
                    false,
                  );
                }
              },


              {

                enableHighAccuracy:
                  true,

                timeout:
                  10000,

                maximumAge:
                  300000,

              },
            );
        };


      loadEvents();


      return () => {

        cancelled =
          true;
      };

    },

    [

      selectedLocation.area,

      selectedLocation.city,

      selectedLocation.country,

      normalizedSearchQuery,

    ],
  );


  /*
   * =========================================================
   * LOCAL CREATED EVENTS
   * =========================================================
   */

  const normalize =
    (value) =>
      String(
        value || '',
      )
        .trim()
        .toLowerCase();


  const matchingCreatedEvents =
    createdEvents.filter(
      (event) => {

        if (
          selectedLocation.city
          &&
          normalize(
            event.city,
          )
          !==
          normalize(
            selectedLocation.city,
          )
        ) {

          return false;
        }


        if (
          selectedLocation.area
          &&
          normalize(
            event.area,
          )
          !==
          normalize(
            selectedLocation.area,
          )
        ) {

          return false;
        }


        if (
          normalizedSearchQuery
        ) {

          const searchableText =
            `${event.title || ''} ${event.description || ''} ${event.venue || ''} ${event.type || ''}`
              .toLowerCase();


          return searchableText
            .includes(
              normalizedSearchQuery
                .toLowerCase(),
            );
        }


        return true;
      },
    );


  const visibleEvents =
    [

      ...matchingCreatedEvents,

      ...nearbyEvents,

    ];


  /*
   * =========================================================
   * LOAD MORE
   * =========================================================
   */

  const loadMoreEvents =
    () =>
      fetchEvents({

        latitude:
          eventCoordinates.latitude,

        longitude:
          eventCoordinates.longitude,

        country:
          eventCoordinates.country,

        city:
          eventCoordinates.city,

        area:
          eventCoordinates.area,

        page:
          eventPage + 1,

        append:
          true,

        query:
          normalizedSearchQuery,

      });


  return (

    <section>

      {/* HEADING */}

      <div
        className="mb-2 flex items-center gap-2"
      >

        <h2
          className="text-xl font-extrabold leading-tight tracking-tight text-gray-900"
        >

          {
            normalizedSearchQuery
              ? (
                  <>

                    Search results for{' '}

                    <span
                      className="text-[#4314A0]"
                    >
                      “{searchQuery}”
                    </span>

                    {' '}near{' '}

                    <span
                      className="text-[#4314A0]"
                    >
                      {location.label}
                    </span>

                  </>
                )

              : (
                  <>

                    What’s Poppin* near{' '}

                    <span
                      className="text-[#4314A0]"
                    >
                      {location.label}
                    </span>

                    {' '}📍

                  </>
                )
          }

        </h2>


        {
          !normalizedSearchQuery
          &&
          (
            <Pencil
              className="size-3.5 cursor-pointer text-[#4314A0]"
            />
          )
        }

      </div>


      {/* EVENT GRID */}

      <div
        className="gatherly-event-stage grid grid-cols-2 gap-3 md:grid-cols-4"
      >

        {
          isLoadingEvents
          &&
          (
            <p
              className="col-span-full py-8 text-center text-sm text-gray-600"
            >

              {
                normalizedSearchQuery

                  ? `Searching events for “${searchQuery}”...`

                  : 'Finding real events near you...'
              }

            </p>
          )
        }


        {
          !isLoadingEvents
          &&
          visibleEvents.map(
            (
              event,
              index,
            ) => (

              <motion.div

                key={
                  event.id
                  ||
                  event.url
                  ||
                  `${event.title}-${index}`
                }

                initial={{
                  opacity:
                    0,

                  y:
                    index % 2
                      ? 28
                      : -28,

                  scale:
                    0.92,
                }}

                whileInView={{
                  opacity:
                    1,

                  y:
                    0,

                  scale:
                    1,
                }}

                viewport={{
                  once:
                    false,

                  amount:
                    0.25,
                }}

                transition={{
                  duration:
                    0.5,

                  delay:
                    index * 0.05,
                }}
              >

                <EventCard

                  {...event}

                  index={
                    index
                  }

                  currentUser={
                    currentUser
                  }

                  onRequireLogin={
                    onRequireLogin
                  }

                />

              </motion.div>

            ),
          )
        }

      </div>


      {/* LOAD MORE */}

      {
        !isLoadingEvents
        &&
        hasMoreEvents
        &&
        (

          <div
            className="mt-5 text-center"
          >

            <button

              type="button"

              onClick={
                loadMoreEvents
              }

              disabled={
                isLoadingMore
              }

              className="rounded-lg bg-[#4314A0] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >

              {
                isLoadingMore
                  ? 'Loading...'
                  : 'Load more events'
              }

            </button>

          </div>
        )
      }


      {/* EMPTY STATE */}

      {
        !isLoadingEvents
        &&
        visibleEvents.length
          === 0
        &&
        (

          <p
            className="mt-4 text-sm text-gray-600"
          >

            {
              eventsError

              ||

              `Currently no events in ${
                selectedLocation.area
                ||
                location.label
              }.`
            }

          </p>
        )
      }

    </section>
  );
}


export default EventGridSection;