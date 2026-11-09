import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!formData.password) {
      setError('Please provide a password.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await register(
        formData.fullName.trim(),
        formData.email.trim(),
        formData.password,
        formData.role
      );

      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F5F5F5] text-gray-900">
      <div className="w-full max-w-md">
        {/* Header / Brand Card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl  bg-black shadow-sm  mb-3 ring-1 ring-white/10">
            <span className="text-2xl">⚖️</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Create an Account
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">
            Join Case Lens AI & claim 25 complimentary AI legal credits
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white backdrop-blur-xl border border-gray-300 rounded-2xl p-6 sm:p-8 shadow-sm shadow-black/60 relative overflow-hidden">
          {/* Subtle ambient glow */}
          <div className="absolute -top-24 -right-20 w-48 h-48 bg-white rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-20 w-48 h-48 bg-white rounded-full blur-3xl pointer-events-none" />

          {error && (
            <div className="mb-5 p-3.5 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn">
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1 leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Advocate Sarah Jenkins"
                className="w-full px-4 py-2.5 bg-white border border-gray-300/80 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-0 focus:border-black focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="sarah@lawfirm.com"
                className="w-full px-4 py-2.5 bg-white border border-gray-300/80 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-0 focus:border-black focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300/80 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-0 focus:border-black focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300/80 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-0 focus:border-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="rounded border-gray-300 bg-white bg-white focus:ring-0"
                />
                <span>Show Passwords</span>
              </label>

              {/* Account role selector */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Role:</span>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg px-2 py-1 focus:ring-0 focus:border-black"
                >
                  <option value="user">User / Researcher</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4  bg-black hover:bg-gray-800 text-white font-semibold rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-black disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register & Claim 25 Credits</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-5 border-t border-gray-300 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="bg-white bg-white font-semibold transition-colors underline-offset-4 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
