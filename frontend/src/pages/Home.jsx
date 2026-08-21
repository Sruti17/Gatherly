import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import HeroBanner from '../compnents/HeroBanner';
import EventGridSection from '../compnents/EventGridSection';
import eventService from '../services/eventService';

const gatherlySteps = [
  {
    emoji: '🔎',
    title: 'Discover your vibe',
    text: 'Browse local events that match your interests and energy.',
  },
  {
    emoji: '🎟️',
    title: 'Join the fun',
    text: 'Pick an event, save your spot, and show up ready to have a good time.',
  },
  {
    emoji: '💜',
    title: 'Meet your people',
    text: 'Turn shared moments into real friendships and communities.',
  },
];

/*
 * These are only presentation colors for the carousel.
 * The event data itself now comes from the backend/Eventbrite.
 */
const carouselColors = [
  'pink',
  'purple',
  'cyan',
];

const friendshipStories = [
  {
    image:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=700&q=85',
    title: 'I used Gatherly to make friends at brunch',
    text:
      'A new member found her people over shared plates and an easy Sunday conversation.',
    accent: 'peach',
  },
  {
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=85',
    title: 'How casual connections become close friendships',
    text:
      'A first meetup became a regular ritual, proving that the best friendships can start small.',
    accent: 'cyan',
  },
  {
    image:
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=700&q=85',
    title: 'Do you have the “right” number of friends?',
    text:
      'Meet people with shared interests and build the kind of community that feels right for you.',
    accent: 'purple',
  },
];

/*
 * Format Eventbrite date for display.
 *
 * Example:
 * 2026-08-22T18:00:00
 *
 * becomes:
 * Sat, Aug 22, 6:00 PM
 */
const formatEventDate = (value) => {
  if (!value) {
    return 'Upcoming';
  }

  const date = new Date(value);

  /*
   * Eventbrite may occasionally return an already formatted
   * date value. If JavaScript cannot parse it, show it as-is.
   */
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
function Home({
  onJoinGang,
  searchQuery,
  selectedLocation,
  createdEvents,
  currentUser,
  onRequireLogin,
}) {

  /*
   * ---------------------------------------------------------
   * POPULAR / EVENTBRITE EVENTS
   * ---------------------------------------------------------
   */

  const [popularEvents, setPopularEvents] = useState([]);
  const [popularIndex, setPopularIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

  const [isPopularLoading, setIsPopularLoading] =
    useState(true);

  const [popularError, setPopularError] =
    useState('');

  /*
   * Use the city selected from the Gatherly header.
   *
   * If there is no manually selected city yet,
   * use Bengaluru as the default for the Trending section.
   */
  const trendingCity =
    selectedLocation?.city?.trim() || 'Bengaluru';

  /*
   * Load trending Eventbrite data whenever
   * the selected city changes.
   */
  useEffect(() => {
    let cancelled = false;

    const loadTrendingEvents = async () => {
      setIsPopularLoading(true);
      setPopularError('');

      try {
        console.log(
          'Loading Eventbrite trending events for:',
          trendingCity,
        );

        const result =
          await eventService.getTrendingEvents({
            city: trendingCity,
            limit: 3,
          });

        console.log(
          'Trending Eventbrite response:',
          result,
        );

        if (cancelled) {
          return;
        }

        const events = Array.isArray(result)
          ? result
          : result?.events || [];

        /*
         * Add carousel colors only for UI presentation.
         */
        const decoratedEvents = events.map(
          (event, index) => ({
            ...event,
            color:
              carouselColors[
                index % carouselColors.length
              ],
          }),
        );

        setPopularEvents(decoratedEvents);

        /*
         * Reset carousel back to first event
         * when city changes.
         */
        setPopularIndex(0);

        if (decoratedEvents.length === 0) {
          setPopularError(
            `No Eventbrite events are available for ${trendingCity} right now.`,
          );
        }
      } catch (error) {
        console.error(
          'Unable to load trending Eventbrite events:',
          error,
        );

        if (!cancelled) {
          setPopularEvents([]);

          setPopularError(
            'Unable to load Eventbrite trending events right now.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsPopularLoading(false);
        }
      }
    };

    loadTrendingEvents();

    return () => {
      cancelled = true;
    };
  }, [trendingCity]);

  const changePopularEvent = (
    nextIndex,
    direction,
  ) => {
    if (!popularEvents.length) {
      return;
    }

    setSlideDirection(direction);

    setPopularIndex(
      (
        nextIndex +
        popularEvents.length
      ) %
        popularEvents.length,
    );
  };

  const activePopularEvent =
    popularEvents[popularIndex] || null;

  /*
   * ---------------------------------------------------------
   * FRIENDSHIP STORIES
   * ---------------------------------------------------------
   */

  const [feedbackIndex, setFeedbackIndex] =
    useState(0);

  const [
    feedbackDirection,
    setFeedbackDirection,
  ] = useState(1);

  const activeFeedback =
    friendshipStories[feedbackIndex];

  const changeFeedback = (
    nextIndex,
    direction,
  ) => {
    setFeedbackDirection(direction);

    setFeedbackIndex(
      (
        nextIndex +
        friendshipStories.length
      ) %
        friendshipStories.length,
    );
  };

  const openEvent = (event) => {
    if (!currentUser) {
      onRequireLogin?.();
      return;
    }

    if (!event?.url) {
      return;
    }

    window.open(
      event.url,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <>
      <HeroBanner onJoinGang={onJoinGang} />

      <motion.main
        className="gatherly-content"
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.15,
          ease: 'easeOut',
        }}
      >
        {/* =====================================================
            EVENTS NEAR USER
        ====================================================== */}

        <EventGridSection
          searchQuery={searchQuery}
          selectedLocation={selectedLocation}
          createdEvents={createdEvents}
          currentUser={currentUser}
          onRequireLogin={onRequireLogin}
        />

        {/* =====================================================
            HOW GATHERLY WORKS
        ====================================================== */}

        <motion.section
          className="gatherly-how-it-works"
          initial={{
            opacity: 0,
            y: 18,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: false,
            amount: 0.3,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a5bd3]">
              The Gatherly vibe
            </p>

            <h2 className="mt-1 text-2xl font-black text-[#341257]">
              How Gatherly works ✨
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
              Find something you love, meet people
              who get it, and make your next
              favorite memory.
            </p>
          </div>

          <div className="gatherly-roadmap">
            <div
              className="gatherly-roadmap-line"
              aria-hidden="true"
            />

            {gatherlySteps.map(
              (step, index) => (
                <motion.article
                  key={step.title}
                  className={`gatherly-roadmap-step gatherly-roadmap-step-${index + 1}`}
                  initial={{
                    opacity: 0,
                    y: index % 2 ? 22 : -22,
                    scale: 0.92,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  viewport={{
                    once: false,
                    amount: 0.55,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.12,
                    ease: 'easeOut',
                  }}
                  whileHover={{
                    y: index % 2 ? -5 : 5,
                    scale: 1.03,
                  }}
                >
                  <div className="gatherly-roadmap-node">
                    {step.emoji}
                  </div>

                  <div className="gatherly-roadmap-copy">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5bd3]">
                      Step 0{index + 1}
                    </p>

                    <h3>
                      {step.title}
                    </h3>

                    <p>
                      {step.text}
                    </p>
                  </div>
                </motion.article>
              ),
            )}
          </div>
        </motion.section>

        {/* =====================================================
            REAL EVENTBRITE TRENDING EVENTS
        ====================================================== */}

        <motion.section
          className="gatherly-popular-events"
          initial={{
            opacity: 0,
            y: 18,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <div className="gatherly-popular-heading">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a5bd3]">
                Trending in {trendingCity}
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#341257]">
                Popular events 🔥
              </h2>
            </div>

            {popularEvents.length > 1 && (
              <div className="gatherly-carousel-controls">
                <button
                  type="button"
                  aria-label="Previous popular event"
                  onClick={() =>
                    changePopularEvent(
                      popularIndex - 1,
                      -1,
                    )
                  }
                >
                  ←
                </button>

                <button
                  type="button"
                  aria-label="Next popular event"
                  onClick={() =>
                    changePopularEvent(
                      popularIndex + 1,
                      1,
                    )
                  }
                >
                  →
                </button>
              </div>
            )}
          </div>

          {/* Loading state */}

          {isPopularLoading && (
            <div className="gatherly-carousel-viewport">
              <div className="flex min-h-[230px] items-center justify-center">
                <p className="text-sm font-semibold text-gray-500">
                  Finding popular Eventbrite events
                  in {trendingCity}...
                </p>
              </div>
            </div>
          )}

          {/* Error / empty state */}

          {!isPopularLoading &&
            popularError && (
              <div className="gatherly-carousel-viewport">
                <div className="flex min-h-[230px] items-center justify-center">
                  <p className="text-sm font-semibold text-gray-500">
                    {popularError}
                  </p>
                </div>
              </div>
            )}

          {/* Real Eventbrite event */}

          {!isPopularLoading &&
            activePopularEvent && (
              <div className="gatherly-carousel-viewport">
                <motion.div
                  key={
                    activePopularEvent.id ||
                    activePopularEvent.url ||
                    activePopularEvent.title
                  }
                  className={`gatherly-carousel-slide gatherly-carousel-${activePopularEvent.color}`}
                  initial={{
                    opacity: 0,
                    x: slideDirection * 80,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x:
                      slideDirection *
                      -80,
                  }}
                  transition={{
                    duration: 0.42,
                    ease: 'easeOut',
                  }}
                  drag="x"
                  dragConstraints={{
                    left: 0,
                    right: 0,
                  }}
                  dragElastic={0.18}
                  onDragEnd={(_, info) => {
                    if (
                      info.offset.x <
                      -60
                    ) {
                      changePopularEvent(
                        popularIndex + 1,
                        1,
                      );
                    }

                    if (
                      info.offset.x >
                      60
                    ) {
                      changePopularEvent(
                        popularIndex - 1,
                        -1,
                      );
                    }
                  }}
                >
                  <div
                    className="gatherly-carousel-art"
                    aria-hidden="true"
                  >
                    {activePopularEvent.image ? (
                      <img
                        src={
                          activePopularEvent.image
                        }
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        🎟️
                      </span>
                    )}
                  </div>

                  <div className="gatherly-carousel-copy">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a5bd3]">
                      Eventbrite · Featured event{' '}
                      {String(
                        popularIndex + 1,
                      ).padStart(2, '0')}
                    </p>

                    <h3>
                      {
                        activePopularEvent.title
                      }
                    </h3>

                    <p>
                      {formatEventDate(
                        activePopularEvent.date,
                      )}

                      {' · '}

                      {activePopularEvent.venue ||
                        trendingCity}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        openEvent(activePopularEvent)
                      }
                      className="gatherly-carousel-link inline-block"
                    >
                      Explore on Eventbrite ↗
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

          {/* Carousel dots */}

          {!isPopularLoading &&
            popularEvents.length > 1 && (
              <div
                className="gatherly-carousel-dots"
                aria-label="Popular event slides"
              >
                {popularEvents.map(
                  (event, index) => (
                    <button
                      key={
                        event.id ||
                        event.url ||
                        event.title
                      }
                      type="button"
                      aria-label={`Show ${event.title}`}
                      aria-current={
                        index ===
                        popularIndex
                      }
                      onClick={() =>
                        changePopularEvent(
                          index,
                          index >
                            popularIndex
                            ? 1
                            : -1,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
        </motion.section>

        {/* =====================================================
            FRIENDSHIP STORIES
        ====================================================== */}

        <motion.section
          className="gatherly-feedback"
          initial={{
            opacity: 0,
            y: 24,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.18,
          }}
          transition={{
            duration: 0.55,
          }}
        >
          <div className="gatherly-feedback-intro">
            <h2>
              Friendships are
              <br />
              made on Gatherly
            </h2>

            <div>
              <p>
                People use Gatherly to make new
                friends, meet like-minded people,
                spend time on hobbies, and connect
                with locals over shared interests.
              </p>
            </div>
          </div>

          <div className="gatherly-feedback-viewport">
            <motion.article
              key={activeFeedback.title}
              className={`gatherly-feedback-page gatherly-feedback-${activeFeedback.accent}`}
              initial={{
                opacity: 0,
                x:
                  feedbackDirection *
                  90,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x:
                  feedbackDirection *
                  -90,
              }}
              transition={{
                duration: 0.45,
                ease: 'easeOut',
              }}
              drag="x"
              dragConstraints={{
                left: 0,
                right: 0,
              }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (
                  info.offset.x <
                  -60
                ) {
                  changeFeedback(
                    feedbackIndex + 1,
                    1,
                  );
                }

                if (
                  info.offset.x >
                  60
                ) {
                  changeFeedback(
                    feedbackIndex - 1,
                    -1,
                  );
                }
              }}
            >
              <button
                type="button"
                className="gatherly-feedback-image-wrap"
                aria-label="Show next feedback story"
                onClick={() =>
                  changeFeedback(
                    feedbackIndex + 1,
                    1,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      'Enter' ||
                    event.key === ' '
                  ) {
                    changeFeedback(
                      feedbackIndex + 1,
                      1,
                    );
                  }
                }}
              >
                <img
                  src={
                    activeFeedback.image
                  }
                  alt="People connecting at a Gatherly-style meetup"
                />
              </button>

              <div className="gatherly-feedback-page-copy">
                <p className="gatherly-feedback-page-number">
                  Story 0
                  {feedbackIndex + 1} / 0
                  {friendshipStories.length}
                </p>

                <h3>
                  {activeFeedback.title}
                </h3>

                <p>
                  {activeFeedback.text}
                </p>

                <span>
                  Read the story ↗
                </span>
              </div>
            </motion.article>
          </div>

          <div
            className="gatherly-feedback-dots"
            aria-label="Feedback stories"
          >
            {friendshipStories.map(
              (story, index) => (
                <button
                  key={story.title}
                  type="button"
                  aria-label={`Show ${story.title}`}
                  aria-current={
                    index ===
                    feedbackIndex
                  }
                  onClick={() =>
                    changeFeedback(
                      index,
                      index >
                        feedbackIndex
                        ? 1
                        : -1,
                    )
                  }
                />
              ),
            )}
          </div>
        </motion.section>
      </motion.main>
    </>
  );
}

export default Home;