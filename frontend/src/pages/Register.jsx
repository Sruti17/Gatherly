import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    authService.register(formData)
      .then((user) => {
        localStorage.setItem('gatherlyUser', JSON.stringify(user));
        navigate('/');
        window.location.reload();
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Registration failed.'))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Gatherly.</h1>
            <p className="text-gray-500">Discover and host amazing local events.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text" name="name" placeholder="Full Name" required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email" name="email" placeholder="Email address" required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="password" name="password" placeholder="Password" required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                onChange={handleChange}
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl hover:bg-gray-800 transition-colors font-medium mt-4"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-black font-semibold hover:underline">Log in</Link>
          </p>
        </motion.div>
      </div>

      {/* Right Column - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-gray-900">
        <motion.img
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"
          alt="People gathering at an event"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12">
          <blockquote className="text-white">
            <p className="text-2xl font-medium mb-4">"The best things in life happen offline. We just make it easier to find them."</p>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default Register;