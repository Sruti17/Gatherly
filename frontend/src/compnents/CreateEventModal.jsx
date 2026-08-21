import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import eventService from '../services/eventService';

const steps = [
  {
    key: 'type',
    title: 'What kind of event are you organizing?',
    options: [
      'Music',
      'Food and drink',
      'Community and culture',
      'Business',
      'Performing and visual art',
      'Seasonal',
      'Other',
    ],
  },
  {
    key: 'revenue',
    title: 'How much revenue do you expect from ticket sales?',
    options: [
      'Free event',
      'Under 5k',
      '5-10k',
      '10-50k',
      '50-250k',
      '250k-1M',
      '1M+',
    ],
  },
  {
    key: 'audience',
    title: 'How many people do you expect to attend?',
    options: [
      '1-50',
      '51-250',
      '251-1,000',
      '1,001-10,000',
      '10,001+',
    ],
  },
];

const initialForm = {
  type: '',
  revenue: '',
  audience: '',
  title: '',
  date: '',
  time: '',
  venue: '',
  country: '',
  city: '',
  area: '',
  description: '',
};

function CreateEventModal({
  isOpen,
  currentUser,
  onClose,
  onEventCreated,
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const updateForm = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError('');
  };

  const closeAndReset = () => {
    setStep(0);
    setForm(initialForm);
    setError('');
    setIsCreated(false);
    setIsPublishing(false);
    onClose();
  };

  const selectOption = (value) => {
    updateForm(steps[step].key, value);

    window.setTimeout(() => {
      setStep((current) => current + 1);
    }, 180);
  };

  const nextStep = () => {
    const currentStep = steps[step];

    if (!form[currentStep.key]) {
      setError('Choose an option to continue.');
      return;
    }

    setStep((current) => current + 1);
    setError('');
  };

  const createEvent = async (event) => {
    event.preventDefault();

    if (
      !form.title?.trim() ||
      !form.date ||
      !form.time ||
      !form.venue?.trim() ||
      !form.city?.trim()
    ) {
      setError(
        'Add the event title, date, time, venue, and city to publish it.',
      );
      return;
    }

    setError('');
    setIsPublishing(true);

    const payload = {
      ...form,
      title: form.title.trim(),
      venue: form.venue.trim(),
      city: form.city.trim(),
      area: form.area?.trim() || '',
      description: form.description?.trim() || '',
      organizerEmail: currentUser?.email || '',
    };

    console.log('Publishing Gatherly event:', payload);

    try {
      const createdEvent =
        await eventService.createEvent(payload);

      console.log(
        'Event successfully created:',
        createdEvent,
      );

      if (onEventCreated) {
        onEventCreated(createdEvent);
      }

      setIsCreated(true);
    } catch (requestError) {
      console.error(
        'Event publishing failed:',
        requestError,
      );

      console.error(
        'Backend error:',
        requestError.response?.data,
      );

      const backendMessage =
        requestError.response?.data?.message ||
        requestError.response?.data?.error;

      setError(
        backendMessage ||
          'The event could not be published. Please try again.',
      );
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-[#241455]/45 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) =>
          event.target === event.currentTarget &&
          closeAndReset()
        }
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-event-title"
          className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border-4 border-[#e5def4] bg-white p-5 shadow-[0_25px_80px_rgba(54,26,91,0.28)] sm:p-8"
          initial={{
            opacity: 0,
            y: 28,
            scale: 0.94,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.96,
          }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 23,
          }}
        >
          <button
            type="button"
            onClick={closeAndReset}
            aria-label="Close create event"
            className="absolute right-5 top-5 rounded-full p-2 text-[#57378e] transition hover:bg-[#f3effa]"
          >
            <X className="size-5" />
          </button>

          {isCreated ? (
            <motion.div
              className="px-2 py-12 text-center"
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
            >
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e9f9d0] text-[#668f1d]">
                <Check className="size-8" />
              </div>

              <h2 className="mt-5 text-3xl font-black text-[#2d2142]">
                Event created successfully!
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                {form.title} has been published and added
                to your local Gatherly events.
              </p>

              <button
                type="button"
                onClick={closeAndReset}
                className="gatherly-glow-button mt-7 px-7 py-3 text-sm font-black text-[#241455]"
              >
                DONE
              </button>
            </motion.div>
          ) : (
            <>
              <div className="mb-7 pr-8">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-[#8a5bd3]">
                  <span>Create an event</span>

                  <span>
                    {Math.min(step + 1, 4)} of 4
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eeeaf4]">
                  <motion.div
                    className="h-full rounded-full bg-[#b6db66]"
                    animate={{
                      width: `${
                        ((step + 1) / 4) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step < steps.length ? (
                  <motion.section
                    key={steps[step].key}
                    initial={{
                      opacity: 0,
                      x: 35,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -35,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                  >
                    <h2
                      id="create-event-title"
                      className="max-w-xl text-3xl font-black leading-tight text-[#2d2142] sm:text-4xl"
                    >
                      {steps[step].title}
                    </h2>

                    <div className="mt-7 flex flex-wrap gap-2.5">
                      {steps[step].options.map(
                        (option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              selectOption(option)
                            }
                            className={`create-event-choice ${
                              form[
                                steps[step].key
                              ] === option
                                ? 'create-event-choice-active'
                                : ''
                            }`}
                          >
                            {option}
                          </button>
                        ),
                      )}
                    </div>
                  </motion.section>
                ) : (
                  <motion.form
                    id="create-event-form"
                    key="details"
                    onSubmit={createEvent}
                    initial={{
                      opacity: 0,
                      x: 35,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -35,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                  >
                    <h2
                      id="create-event-title"
                      className="text-3xl font-black leading-tight text-[#2d2142] sm:text-4xl"
                    >
                      Give your event the finishing
                      touches.
                    </h2>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <label className="create-event-label sm:col-span-2">
                        Event name
                        <input
                          required
                          value={form.title}
                          onChange={(event) =>
                            updateForm(
                              'title',
                              event.target.value,
                            )
                          }
                          placeholder="e.g. Sunday Social"
                          className="join-gang-input"
                        />
                      </label>

                      <label className="create-event-label">
                        Date
                        <input
                          required
                          type="date"
                          value={form.date}
                          onChange={(event) =>
                            updateForm(
                              'date',
                              event.target.value,
                            )
                          }
                          className="join-gang-input"
                        />
                      </label>

                      <label className="create-event-label">
                        Time
                        <input
                          required
                          type="time"
                          value={form.time}
                          onChange={(event) =>
                            updateForm(
                              'time',
                              event.target.value,
                            )
                          }
                          className="join-gang-input"
                        />
                      </label>

                      <label className="create-event-label">
                        Venue
                        <input
                          required
                          value={form.venue}
                          onChange={(event) =>
                            updateForm(
                              'venue',
                              event.target.value,
                            )
                          }
                          placeholder="Venue name"
                          className="join-gang-input"
                        />
                      </label>

                      <label className="create-event-label">
                        City
                        <input
                          required
                          value={form.city}
                          onChange={(event) =>
                            updateForm(
                              'city',
                              event.target.value,
                            )
                          }
                          placeholder="Bengaluru"
                          className="join-gang-input"
                        />
                      </label>

                      <label className="create-event-label">
                        Area
                        <input
                          value={form.area}
                          onChange={(event) =>
                            updateForm(
                              'area',
                              event.target.value,
                            )
                          }
                          placeholder="Indiranagar"
                          className="join-gang-input"
                        />
                      </label>

                      <label className="create-event-label sm:col-span-2">
                        Description
                        <textarea
                          value={form.description}
                          onChange={(event) =>
                            updateForm(
                              'description',
                              event.target.value,
                            )
                          }
                          placeholder="What should people know?"
                          className="join-gang-input min-h-24 resize-y"
                        />
                      </label>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {error && (
                <p
                  role="alert"
                  className="mt-4 text-sm font-semibold text-red-600"
                >
                  {error}
                </p>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setStep((current) =>
                      Math.max(0, current - 1),
                    )
                  }
                  disabled={step === 0}
                  className="flex size-10 items-center justify-center rounded-full bg-[#f0eef3] text-[#433850] disabled:opacity-0"
                  aria-label="Previous step"
                >
                  <ArrowLeft className="size-4" />
                </button>

                {step === steps.length ? (
                  <button
                    type="submit"
                    form="create-event-form"
                    disabled={isPublishing}
                    className="gatherly-glow-button flex items-center gap-2 px-6 py-3 text-sm font-black text-[#241455] disabled:cursor-wait disabled:opacity-60"
                  >
                    {isPublishing
                      ? 'PUBLISHING...'
                      : 'PUBLISH EVENT'}

                    <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={isPublishing}
                    className="gatherly-glow-button flex items-center gap-2 px-6 py-3 text-sm font-black text-[#241455] disabled:cursor-wait disabled:opacity-60"
                  >
                    NEXT
                    <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CreateEventModal;