// Location: frontend/src/App.jsx

import React, {
  useEffect,
  useState,
} from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Header from './compnents/Header';
import Footer from './compnents/Footer';

import HomePage from './pages/Home';

import Register from './pages/Register';
import Login from './pages/login';

import JoinGangModal from './compnents/JoinGangModal';
import LoginModal from './compnents/LoginModal';
import CreateEventModal from './compnents/CreateEventModal';

import eventService from './services/eventService';


// Primary Gatherly purple.
export const primaryPurple = '#4314A0';


function App() {

  /*
   * =========================================================
   * MODALS
   * =========================================================
   */

  const [
    isJoinGangOpen,
    setIsJoinGangOpen,
  ] = useState(false);


  const [
    isLoginOpen,
    setIsLoginOpen,
  ] = useState(false);


  const [
    isCreateEventOpen,
    setIsCreateEventOpen,
  ] = useState(false);


  /*
   * =========================================================
   * APP STATE
   * =========================================================
   */

  const [
    logoutMessage,
    setLogoutMessage,
  ] = useState('');


  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');


  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState({
    country: '',
    city: '',
    area: '',
  });


  const [
    createdEvents,
    setCreatedEvents,
  ] = useState([]);


  /*
   * =========================================================
   * CURRENT LOGGED-IN USER
   * =========================================================
   *
   * If Gatherly previously stored the user in localStorage,
   * load the user when the application starts.
   */

  const [
    currentUser,
    setCurrentUser,
  ] = useState(() => {

    try {

      const storedUser =
        localStorage.getItem(
          'gatherlyUser',
        );


      if (!storedUser) {

        return null;
      }


      return JSON.parse(
        storedUser,
      );


    } catch (
      error
    ) {

      console.error(
        'Unable to read Gatherly user from localStorage:',
        error,
      );


      return null;
    }
  });


  /*
   * =========================================================
   * LOAD GATHERLY-CREATED EVENTS
   * =========================================================
   */

  useEffect(() => {

    eventService
      .getCreatedEvents()

      .then(
        setCreatedEvents,
      )

      .catch(
        (error) => {

          console.error(
            'Unable to load Gatherly-created events:',
            error,
          );


          setCreatedEvents(
            [],
          );
        },
      );

  }, []);


  /*
   * =========================================================
   * LOGIN / REGISTRATION SUCCESS
   * =========================================================
   */

  const handleAuthenticated =
    (user) => {

      setCurrentUser(
        user,
      );


      localStorage.setItem(
        'gatherlyUser',
        JSON.stringify(
          user,
        ),
      );


      /*
       * Close login / registration modals after
       * successful authentication.
       */
      setIsLoginOpen(
        false,
      );


      setIsJoinGangOpen(
        false,
      );
    };


  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  const handleLogout =
    () => {

      localStorage.removeItem(
        'gatherlyUser',
      );


      setCurrentUser(
        null,
      );


      setLogoutMessage(
        'Logout successfully',
      );


      window.setTimeout(
        () =>
          setLogoutMessage(
            '',
          ),

        2500,
      );
    };


  /*
   * =========================================================
   * REQUIRE LOGIN
   * =========================================================
   *
   * EventGridSection calls this whenever a user
   * tries to open an event while not logged in.
   */

  const handleRequireLogin =
    () => {

      setIsLoginOpen(
        true,
      );
    };


  return (

    <Router>

      <div
        className="gatherly-shell flex min-h-screen flex-col bg-white text-gray-900"
      >

        {/* ===================================================
            GLOBAL HEADER
        ==================================================== */}

        <Header

          currentUser={
            currentUser
          }

          onLogin={
            () =>
              setIsLoginOpen(
                true,
              )
          }

          onLogout={
            handleLogout
          }

          onSearch={
            setSearchQuery
          }

          onLocationChange={
            setSelectedLocation
          }

          onCreateEvent={
            () =>
              setIsCreateEventOpen(
                true,
              )
          }

        />


        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}

        <main
          className="flex-grow"
        >

          <Routes>

            {/* ===============================================
                HOME PAGE
            ================================================ */}

            <Route

              path="/"

              element={

                <HomePage

                  /*
                   * Existing props
                   */
                  onJoinGang={
                    () =>
                      setIsJoinGangOpen(
                        true,
                      )
                  }

                  searchQuery={
                    searchQuery
                  }

                  selectedLocation={
                    selectedLocation
                  }

                  createdEvents={
                    createdEvents
                  }


                  /*
                   * NEW:
                   *
                   * Pass current authenticated user
                   * to Home -> EventGridSection.
                   */
                  currentUser={
                    currentUser
                  }


                  /*
                   * NEW:
                   *
                   * Event click calls this when
                   * no user is authenticated.
                   *
                   * Result:
                   *
                   * Event card
                   *     ↓
                   * not logged in
                   *     ↓
                   * LoginModal opens
                   */
                  onRequireLogin={
                    handleRequireLogin
                  }

                />

              }

            />


            {/* ===============================================
                REGISTER PAGE
            ================================================ */}

            <Route

              path="/register"

              element={
                <Register />
              }

            />


            {/* ===============================================
                LOGIN PAGE
            ================================================ */}

            <Route

              path="/login"

              element={
                <Login />
              }

            />


            {/* ===============================================
                TEMPORARY /HOME REDIRECT
            ================================================ */}

            <Route

              path="/home"

              element={

                <Navigate
                  to="/"
                  replace
                />

              }

            />

          </Routes>

        </main>


        {/* ===================================================
            GLOBAL FOOTER
        ==================================================== */}

        <Footer />


        {/* ===================================================
            LOGOUT MESSAGE
        ==================================================== */}

        {
          logoutMessage
          &&
          (

            <div

              role="status"

              className="fixed right-5 top-24 z-[120] rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-bold text-green-700 shadow-lg"
            >

              {logoutMessage}

            </div>

          )
        }


        {/* ===================================================
            CREATE ACCOUNT MODAL
        ==================================================== */}

        <JoinGangModal

          isOpen={
            isJoinGangOpen
          }

          onClose={
            () =>
              setIsJoinGangOpen(
                false,
              )
          }

          onAuthenticated={
            handleAuthenticated
          }

        />


        {/* ===================================================
            LOGIN MODAL
        ==================================================== */}

        <LoginModal

          isOpen={
            isLoginOpen
          }

          onClose={
            () =>
              setIsLoginOpen(
                false,
              )
          }

          onAuthenticated={
            handleAuthenticated
          }

          onCreateAccount={
            () => {

              setIsLoginOpen(
                false,
              );


              setIsJoinGangOpen(
                true,
              );
            }
          }

        />


        {/* ===================================================
            CREATE EVENT MODAL
        ==================================================== */}

        <CreateEventModal

          isOpen={
            isCreateEventOpen
          }

          currentUser={
            currentUser
          }

          onClose={
            () =>
              setIsCreateEventOpen(
                false,
              )
          }

          onEventCreated={
            (event) =>
              setCreatedEvents(
                (current) => [
                  event,
                  ...current,
                ],
              )
          }

        />

      </div>

    </Router>
  );
}


export default App;