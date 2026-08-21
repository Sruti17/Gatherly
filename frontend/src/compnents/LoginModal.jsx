import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { X } from 'lucide-react';

import authService
  from '../services/authService';


const GOOGLE_SCRIPT_ID =
  'google-identity-services-login';


/*
 * =========================================================
 * LOAD GOOGLE IDENTITY SERVICES
 * =========================================================
 */

const loadGoogleIdentityServices =
  () =>
    new Promise(
      (resolve, reject) => {

        if (
          window.google
            ?.accounts
            ?.id
        ) {

          resolve();
          return;
        }


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

          script.async =
            true;

          script.defer =
            true;

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


function LoginModal({

  isOpen,

  onClose,

  onAuthenticated,

  onCreateAccount,

}) {

  const [
    form,
    setForm,
  ] = useState({
    email: '',
    password: '',
  });


  const [
    error,
    setError,
  ] = useState(
    '',
  );


  const [
    isLoading,
    setIsLoading,
  ] = useState(
    false,
  );


  const [
    isGoogleLoading,
    setIsGoogleLoading,
  ] = useState(
    false,
  );


  const [
    googleStatus,
    setGoogleStatus,
  ] = useState(
    '',
  );


  const googleButtonRef =
    useRef(
      null,
    );


  /* =========================================================
     MODAL BEHAVIOR
     ========================================================= */

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


  /* =========================================================
     GOOGLE LOGIN BUTTON
     ========================================================= */

  useEffect(
    () => {

      if (!isOpen) {

        return undefined;
      }


      let cancelled =
        false;


      const googleClientId =
        import.meta.env
          .VITE_GOOGLE_CLIENT_ID;


      if (!googleClientId) {

        setError(
          'Google login is not configured.',
        );

        return undefined;
      }


      const setupGoogle =
        async () => {

          try {

            await loadGoogleIdentityServices();


            if (
              cancelled
                ||
              !googleButtonRef.current
            ) {

              return;
            }


            googleButtonRef
              .current
              .replaceChildren();


            window.google
              .accounts
              .id
              .initialize({

                client_id:
                  googleClientId,


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
                        'Google did not return a login credential.',
                      );

                      return;
                    }


                    setError('');

                    setGoogleStatus(
                      'Checking your Gatherly account...',
                    );

                    setIsGoogleLoading(
                      true,
                    );


                    try {

                      /*
                       * IMPORTANT:
                       *
                       * Login modal calls googleLogin(),
                       * NOT googleSignIn().
                       *
                       * Backend will therefore NOT
                       * create a new user.
                       */
                      const user =
                        await authService
                          .googleLogin(
                            response
                              .credential,
                          );


                      if (
                        cancelled
                      ) {

                        return;
                      }


                      onAuthenticated(
                        user,
                      );


                      setGoogleStatus(
                        '',
                      );


                      setForm({
                        email: '',
                        password: '',
                      });


                      onClose();


                    } catch (
                      requestError
                    ) {

                      console.error(
                        'Google login failed:',
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

                        'Google login failed. Please try again.';


                      setError(
                        message,
                      );


                      setGoogleStatus(
                        '',
                      );

                    } finally {

                      if (
                        !cancelled
                      ) {

                        setIsGoogleLoading(
                          false,
                        );
                      }
                    }
                  },
              });


            /*
             * Official Google login button.
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
                    'signin_with',

                  shape:
                    'rectangular',

                  logo_alignment:
                    'left',

                  width:
                    360,
                },
              );


          } catch (
            googleError
          ) {

            console.error(
              'Google button setup failed:',
              googleError,
            );


            if (
              !cancelled
            ) {

              setError(
                'Could not load Google login. Please try again.',
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
      onAuthenticated,
      onClose,
    ],
  );


  /* =========================================================
     EMAIL/PASSWORD LOGIN
     ========================================================= */

  const handleSubmit =
    async (
      event,
    ) => {

      event.preventDefault();


      setError('');

      setIsLoading(
        true,
      );


      try {

        const user =
          await authService.login(
            form,
          );


        onAuthenticated(
          user,
        );


        setForm({
          email: '',
          password: '',
        });


        onClose();


      } catch (
        requestError
      ) {

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

          'Login failed. Check your email and password.',
        );

      } finally {

        setIsLoading(
          false,
        );
      }
    };


  /* =========================================================
     CLOSE
     ========================================================= */

  const handleClose =
    () => {

      setError('');

      setGoogleStatus('');

      setIsGoogleLoading(
        false,
      );

      onClose();
    };


  /* =========================================================
     SWITCH TO ACCOUNT CREATION
     ========================================================= */

  const handleCreateAccount =
    () => {

      setError('');

      setGoogleStatus('');

      onCreateAccount();
    };


  if (!isOpen) {

    return null;
  }


  return (

    <div

      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"

      onMouseDown={
        (event) =>
          event.target
            ===
          event.currentTarget

            &&
          handleClose()
      }
    >

      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
      >

        <button

          type="button"

          onClick={
            handleClose
          }

          aria-label="Close login"

          className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >

          <X
            className="size-5"
          />

        </button>


        <form
          onSubmit={
            handleSubmit
          }
          className="pt-3"
        >

          <h2
            className="text-center text-3xl font-black text-gray-900"
          >
            Log in
          </h2>


          {/* ================================================
              GOOGLE LOGIN
          ================================================= */}

          <div
            className="mt-7 flex justify-center"
          >

            <div
              ref={
                googleButtonRef
              }
            />

          </div>


          {isGoogleLoading && (

            <p
              className="mt-3 text-center text-xs font-semibold text-[#7250cf]"
            >
              Logging you in with Google...
            </p>

          )}


          {googleStatus &&
            !isGoogleLoading && (

              <p
                className="mt-3 text-center text-xs font-semibold text-[#7250cf]"
              >
                {googleStatus}
              </p>

            )}


          <div
            className="my-5 flex items-center gap-3 text-xs text-gray-500"
          >

            <span
              className="h-px flex-1 bg-gray-200"
            />

            or

            <span
              className="h-px flex-1 bg-gray-200"
            />

          </div>


          {/* ================================================
              ERROR MESSAGE
          ================================================= */}

          {error && (

            <div
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3"
            >

              <p
                role="alert"
                className="text-sm font-medium text-red-600"
              >
                {error}
              </p>


              {error
                .toLowerCase()
                .includes(
                  'create an account',
                )
                && (

                  <button

                    type="button"

                    onClick={
                      handleCreateAccount
                    }

                    className="mt-2 text-sm font-bold text-[#7250cf] hover:underline"
                  >
                    Create an account →
                  </button>

                )}

            </div>

          )}


          {/* ================================================
              EMAIL
          ================================================= */}

          <label
            className="block text-sm font-semibold text-gray-700"
          >

            Email

            <input

              type="email"

              required

              value={
                form.email
              }

              onChange={
                (event) =>
                  setForm({
                    ...form,

                    email:
                      event
                        .target
                        .value,
                  })
              }

              className="join-gang-input"
            />

          </label>


          {/* ================================================
              PASSWORD
          ================================================= */}

          <label
            className="mt-3 block text-sm font-semibold text-gray-700"
          >

            Password

            <input

              type="password"

              required

              maxLength="72"

              value={
                form.password
              }

              onChange={
                (event) =>
                  setForm({
                    ...form,

                    password:
                      event
                        .target
                        .value,
                  })
              }

              className="join-gang-input"
            />

          </label>


          <label
            className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-700"
          >

            <input

              type="checkbox"

              defaultChecked

              className="size-4 accent-[#57378e]"
            />

            Keep me logged in

          </label>


          {/* ================================================
              NORMAL LOGIN BUTTON
          ================================================= */}

          <button

            type="submit"

            disabled={
              isLoading
                ||
              isGoogleLoading
            }

            className="mt-4 w-full rounded-full bg-gray-100 px-4 py-3 text-sm font-bold text-gray-500 disabled:opacity-60"
          >

            {
              isLoading

                ? 'Logging in...'

                : 'Log in'
            }

          </button>


          <p
            className="mt-5 text-center text-sm font-semibold text-[#7250cf]"
          >
            Forgot password?
          </p>


          <p
            className="mt-4 text-center text-xs text-gray-600"
          >

            New to Gatherly?{' '}

            <button

              type="button"

              onClick={
                handleCreateAccount
              }

              className="font-bold text-[#7250cf] hover:underline"
            >
              Create a new account
            </button>

          </p>

        </form>

      </div>

    </div>
  );
}


export default LoginModal;