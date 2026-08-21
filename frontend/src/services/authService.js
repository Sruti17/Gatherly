import api from './api';


/*
 * =========================================================
 * LOCAL REGISTRATION
 * =========================================================
 */

const register = async (userData) => {

  const response =
    await api.post(
      '/auth/register',
      userData,
    );

  return response.data.data;
};


/*
 * =========================================================
 * LOCAL LOGIN
 * =========================================================
 */

const login = async (credentials) => {

  const response =
    await api.post(
      '/auth/login',
      credentials,
    );

  return response.data.data;
};


/*
 * =========================================================
 * GOOGLE ACCOUNT CREATION / REGISTRATION
 * =========================================================
 *
 * Used from JoinGangModal.
 *
 * If the account does not exist,
 * backend may create it.
 */

const googleSignIn = async (
  credential,
) => {

  const response =
    await api.post(
      '/auth/google',
      {
        credential,
      },
    );

  return response.data.data;
};


/*
 * =========================================================
 * GOOGLE LOGIN ONLY
 * =========================================================
 *
 * Used from LoginModal.
 *
 * This endpoint does NOT create accounts.
 */

const googleLogin = async (
  credential,
) => {

  const response =
    await api.post(
      '/auth/google/login',
      {
        credential,
      },
    );

  return response.data.data;
};


export default {
  register,
  login,
  googleSignIn,
  googleLogin,
};