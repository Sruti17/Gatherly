import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import {
  X,
} from 'lucide-react';

import authService
  from '../services/authService';


const initialForm = {
  name: '',
  email: '',
  phone: '',
  occupation: '',
  company: '',
  password: '',
};


const GOOGLE_SCRIPT_ID =
  'google-identity-services';


/*
 * =========================================================
 * LOAD GOOGLE IDENTITY SERVICES
 * =========================================================
 *
 * Google recommends loading:
 *
 * https://accounts.google.com/gsi/client
 *
 * directly from Google.
 *
 * Do not download/self-host this JavaScript.
 */
const loadGoogleIdentityServices =
  () =>
    new Promise(
      (resolve, reject) => {

        /*
         * Already loaded.
         */
        if (
          window.google
            ?.accounts
            ?.id
        ) {

          resolve();
          return;
        }


        /*
         * Add script only once.
         */
        let script =
          document.getElementById(
            GOOGLE_SCRIPT_ID,
          );


        if (!script) {

          script =
            document.createElement(
              'script',
            );


          script.id =
            GOOGLE_SCRIPT_ID;


          script.src =
            'https://accounts.google.com/gsi/client';


          script.async = true;

          script.defer = true;


          script.onerror =
            () =>
              reject(
                new Error(
                  'Could not load Google Identity Services.',
                ),
              );


          document.head.appendChild(
            script,
          );
        }


        /*
         * Wait for GIS to become available.
         */
        const startedAt =
          Date.now();


        const waitForGoogle =
          () => {

            if (
              window.google
                ?.accounts
                ?.id
            ) {

              resolve();
              return;
            }


            if (
              Date.now()
                - startedAt
              > 8000
            ) {

              reject(
                new Error(
                  'Google Identity Services timed out.',
                ),
              );

              return;
            }


            window.setTimeout(
              waitForGoogle,
              100,
            );
          };


        waitForGoogle();
      },
    );


function JoinGangModal({

  isOpen,

  onClose,

  onAuthenticated,

}) {

  const [
    form,
    setForm,
  ] = useState(
    initialForm,
  );


  const [
    submitted,
    setSubmitted,
  ] = useState(
    false,
  );


  const [
    googleMessage,
    setGoogleMessage,
  ] = useState(
    '',
  );


  const [
    error,
    setError,
  ] = useState(
    '',
  );


  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(
    false,
  );


  const [
    isGoogleSubmitting,
    setIsGoogleSubmitting,
  ] = useState(
    false,
  );


  /*
   * Google renders its official button
   * inside this DOM container.
   */
  const googleButtonRef =
    useRef(
      null,
    );


  /*
   * =======================================================
   * MODAL KEYBOARD / BODY LOCK
   * =======================================================
   */

  useEffect(
    () => {

      if (!isOpen) {

        return undefined;
      }


      const handleKeyDown =
        (event) => {

          if (
            event.key
              === 'Escape'
          ) {

            onClose();
          }
        };


      document.addEventListener(
        'keydown',
        handleKeyDown,
      );


      document.body.style.overflow =
        'hidden';


      return () => {

        document.removeEventListener(
          'keydown',
          handleKeyDown,
        );


        document.body.style.overflow =
          '';
      };
    },

    [
      isOpen,
      onClose,
    ],
  );


  /*
   * =======================================================
   * INITIALIZE GOOGLE SIGN-IN BUTTON
   * =======================================================
   */

  useEffect(
    () => {

      if (
        !isOpen ||
        submitted
      ) {

        return undefined;
      }


      let cancelled =
        false;


      const googleClientId =
        import.meta.env
          .VITE_GOOGLE_CLIENT_ID;
      
      console.log(
        'GOOGLE CLIENT ID BEING USED:',
        googleClientId,
      );

      /*
       * Vite environment variable missing.
       */
      if (
        !googleClientId
      ) {

        setGoogleMessage(
          'Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to frontend/.env.local.',
        );

        return undefined;
      }


      const setupGoogle =
        async () => {

          try {

            await loadGoogleIdentityServices();


            if (
              cancelled ||
              !googleButtonRef.current
            ) {

              return;
            }


            /*
             * Clear previously rendered Google iframe
             * when modal reopens.
             */
            googleButtonRef
              .current
              .replaceChildren();


            window.google
              .accounts
              .id
              .initialize({

                client_id:
                  googleClientId,


                /*
                 * Google sends the signed ID token
                 * here as response.credential.
                 */
                callback:
                  async (
                    response,
                  ) => {

                    if (
                      cancelled
                    ) {

                      return;
                    }


                    if (
                      !response
                        ?.credential
                    ) {

                      setError(
                        'Google did not return a sign-in credential.',
                      );

                      return;
                    }


                    setError('');

                    setGoogleMessage(
                      'Signing you in with Google...',
                    );

                    setIsGoogleSubmitting(
                      true,
                    );


                    try {

                      /*
                       * Send Google's ID token
                       * to Spring Boot.
                       */
                      const user =
                        await authService
                          .googleSignIn(
                            response
                              .credential,
                          );


                      if (
                        cancelled
                      ) {

                        return;
                      }


                      /*
                       * App.jsx stores this in
                       * gatherlyUser/localStorage.
                       */
                      onAuthenticated(
                        user,
                      );


                      setGoogleMessage(
                        '',
                      );


                      /*
                       * Display the existing
                       * "You're in!" screen.
                       */
                      setSubmitted(
                        true,
                      );

                    } catch (
                      requestError
                    ) {

                      console.error(
                        'Google authentication failed:',
                        requestError,
                      );


                      const message =
                        requestError
                          .response
                          ?.data
                          ?.message
                        ||
                        requestError
                          .response
                          ?.data
                          ?.detail
                        ||
                        'Google sign-in failed. Please try again.';


                      setError(
                        message,
                      );


                      setGoogleMessage(
                        '',
                      );

                    } finally {

                      if (
                        !cancelled
                      ) {

                        setIsGoogleSubmitting(
                          false,
                        );
                      }
                    }
                  },
              });


            /*
             * Official Google button.
             *
             * This opens Google's account chooser.
             */
            window.google
              .accounts
              .id
              .renderButton(

                googleButtonRef.current,

                {
                  type:
                    'standard',

                  theme:
                    'outline',

                  size:
                    'large',

                  text:
                    'continue_with',

                  shape:
                    'pill',

                  logo_alignment:
                    'left',

                  width:
                    360,
                },
              );


            setGoogleMessage(
              '',
            );

          } catch (
            googleError
          ) {

            console.error(
              'Google Identity Services failed to load:',
              googleError,
            );


            if (
              !cancelled
            ) {

              setGoogleMessage(
                'Could not load Google sign-in. Check your internet connection and Google Client ID.',
              );
            }
          }
        };


      setupGoogle();


      return () => {

        cancelled =
          true;
      };
    },

    [
      isOpen,
      submitted,
      onAuthenticated,
    ],
  );


  /*
   * =======================================================
   * LOCAL FORM
   * =======================================================
   */

  const handleChange =
    (event) => {

      setForm(
        (current) => ({
          ...current,

          [event
            .target
            .name]:
            event
              .target
              .value,
        }),
      );


      setError('');
    };


  const handleSubmit =
    (event) => {

      event.preventDefault();


      setError('');

      setIsSubmitting(
        true,
      );


      authService
        .register(
          form,
        )

        .then(
          (user) => {

            onAuthenticated(
              user,
            );


            setSubmitted(
              true,
            );
          },
        )

        .catch(
          (
            requestError,
          ) => {

            setError(

              requestError
                .response
                ?.data
                ?.message

              ||

              requestError
                .response
                ?.data
                ?.detail

              ||

              (
                requestError
                  .request

                  ? 'The backend is unavailable. Start the server and try again.'

                  : 'Could not create your account. Please try again.'
              ),
            );
          },
        )

        .finally(
          () =>
            setIsSubmitting(
              false,
            ),
        );
    };


  /*
   * =======================================================
   * CLOSE + RESET
   * =======================================================
   */

  const handleClose =
    () => {

      setForm(
        initialForm,
      );

      setSubmitted(
        false,
      );

      setGoogleMessage(
        '',
      );

      setError('');

      setIsSubmitting(
        false,
      );

      setIsGoogleSubmitting(
        false,
      );


      onClose();
    };


  return (
    <AnimatePresence>

      {isOpen && (

        <motion.div

          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#241455]/45 p-4 backdrop-blur-sm"

          initial={{
            opacity: 0,
          }}

          animate={{
            opacity: 1,
          }}

          exit={{
            opacity: 0,
          }}

          onMouseDown={
            (event) =>
              event.target
                ===
              event.currentTarget

                &&
              handleClose()
          }
        >

          <motion.div

            role="dialog"

            aria-modal="true"

            aria-labelledby="join-gang-title"

            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border-4 border-[#d6c4ff] bg-white p-6 shadow-[0_0_25px_#d7a9ff]"

            initial={{
              opacity: 0,
              y: 24,
              scale: 0.94,
            }}

            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}

            exit={{
              opacity: 0,
              y: 16,
              scale: 0.96,
            }}

            transition={{
              type:
                'spring',

              stiffness:
                260,

              damping:
                22,
            }}
          >

            <button

              type="button"

              aria-label="Close join form"

              onClick={
                handleClose
              }

              className="absolute right-4 top-4 rounded-full p-1 text-[#57378e] transition hover:bg-[#f2eaff]"
            >

              <X
                className="size-5"
              />

            </button>


            {!submitted ? (

              <>

                <div
                  className="pr-8"
                >

                  <p
                    className="text-sm font-bold uppercase tracking-[0.18em] text-[#8a5bd3]"
                  >
                    Welcome to the vibe ✨
                  </p>


                  <h2

                    id="join-gang-title"

                    className="mt-1 text-3xl font-black text-[#341257]"
                  >
                    Join the gang
                  </h2>


                  <p
                    className="mt-2 text-sm text-gray-600"
                  >
                    Tell us a little about yourself and we will save you a spot.
                  </p>

                </div>


                <form

                  onSubmit={
                    handleSubmit
                  }

                  className="mt-5 space-y-3"
                >

                  <label
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Name

                    <input

                      name="name"

                      value={
                        form.name
                      }

                      onChange={
                        handleChange
                      }

                      required

                      placeholder="Your name"

                      className="join-gang-input"
                    />

                  </label>


                  <label
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Email

                    <input

                      name="email"

                      type="email"

                      value={
                        form.email
                      }

                      onChange={
                        handleChange
                      }

                      required

                      placeholder="you@example.com"

                      className="join-gang-input"
                    />

                  </label>


                  <label
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Phone

                    <input

                      name="phone"

                      type="tel"

                      value={
                        form.phone
                      }

                      onChange={
                        handleChange
                      }

                      required

                      placeholder="Your phone number"

                      className="join-gang-input"
                    />

                  </label>


                  <label
                    className="block text-sm font-semibold text-gray-700"
                  >
                    What do you do?

                    <input

                      name="occupation"

                      value={
                        form.occupation
                      }

                      onChange={
                        handleChange
                      }

                      required

                      placeholder="Designer, student, founder..."

                      className="join-gang-input"
                    />

                  </label>


                  <label
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Which company?

                    <input

                      name="company"

                      value={
                        form.company
                      }

                      onChange={
                        handleChange
                      }

                      required

                      placeholder="Your company or school"

                      className="join-gang-input"
                    />

                  </label>


                  <label
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Password

                    <input

                      name="password"

                      type="password"

                      minLength="8"

                      value={
                        form.password
                      }

                      onChange={
                        handleChange
                      }

                      required

                      placeholder="At least 8 characters"

                      className="join-gang-input"
                    />

                  </label>


                  {error && (

                    <p

                      role="alert"

                      className="text-sm font-medium text-red-600"
                    >
                      {error}
                    </p>

                  )}


                  <button

                    type="submit"

                    disabled={
                      isSubmitting
                      ||
                      isGoogleSubmitting
                    }

                    className="gatherly-glow-button mt-2 w-full px-4 py-3 text-sm font-black text-[#241455] disabled:cursor-wait disabled:opacity-60"
                  >

                    {
                      isSubmitting

                        ? 'CREATING ACCOUNT...'

                        : "LET'S GO ✨"
                    }

                  </button>


                  <div
                    className="flex items-center gap-3 py-1 text-xs text-gray-400"
                  >

                    <span
                      className="h-px flex-1 bg-gray-200"
                    />

                    OR

                    <span
                      className="h-px flex-1 bg-gray-200"
                    />

                  </div>


                  {/*
                    Google Identity Services renders
                    its official button here.
                  */}

                  <div
                    className="flex w-full justify-center"
                  >

                    <div
                      ref={
                        googleButtonRef
                      }
                    />

                  </div>


                  {isGoogleSubmitting && (

                    <p
                      className="text-center text-xs font-semibold text-[#7250cf]"
                    >
                      Signing you in with Google...
                    </p>

                  )}


                  {
                    googleMessage
                    &&
                    !isGoogleSubmitting
                    && (

                      <p

                        role="status"

                        className="text-center text-xs font-medium text-[#7250cf]"
                      >
                        {googleMessage}
                      </p>

                    )
                  }

                </form>

              </>

            ) : (

              <div
                className="py-10 text-center"
              >

                <div
                  className="text-5xl"
                >
                  🎉
                </div>


                <h2

                  id="join-gang-title"

                  className="mt-4 text-3xl font-black text-[#341257]"
                >
                  You’re in!
                </h2>


                <p
                  className="mt-2 text-sm text-gray-600"
                >
                  Thanks for joining the Gatherly gang.
                </p>


                <button

                  type="button"

                  onClick={
                    handleClose
                  }

                  className="gatherly-glow-button mt-6 px-6 py-2 text-sm font-bold text-[#241455]"
                >
                  Close
                </button>

              </div>

            )}

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>
  );
}


export default JoinGangModal;