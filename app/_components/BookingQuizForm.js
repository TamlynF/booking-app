"use client";

import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ChevronDown
} from 'lucide-react';


const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+91', country: 'IN' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' },
];


function BookingQuizForm() {
    const [formData, setFormData] = useState({
      quizDate: '',
      fullName: '',
      email: '',
      countryCode: '+44',
      phoneNumber: '',
      teamName: '',
      teamSize: '4',
    });
  
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      //setStatus('loading');
  
      // try {
      //   if (supabase) {
      //     // --- REAL SUPABASE SUBMISSION ---
      //     // Ensure your 'bookings' table exists with these columns
      //     const { error } = await supabase
      //       .from('bookings')
      //       .insert([
      //         {
      //           quiz_date: formData.quizDate,
      //           full_name: formData.fullName,
      //           email: formData.email,
      //           phone: `${formData.countryCode} ${formData.phoneNumber}`,
      //           team_name: formData.teamName,
      //           team_size: parseInt(formData.teamSize),
      //           created_at: new Date().toISOString(),
      //         },
      //       ]);
  
      //     if (error) throw error;
          
      //     setStatus('success');
      //   } else {
      //     // --- MOCK SUBMISSION FOR DEMO ---
      //     console.log("Simulating Supabase Submission:", formData);
      //     await new Promise(resolve => setTimeout(resolve, 2000)); // Fake network delay
      //     setStatus('success');
      //   }
      // } catch (error) {
      //   console.error('Error booking:', error);
      //   setErrorMessage(error.message || 'Something went wrong. Please try again.');
      //   setStatus('error');
      // }
      setStatus('success');
    };

    if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-slate-400 mb-6">
            Get your team ready, <strong>{formData.teamName}</strong>! We&apos;ve booked you in for <strong>{formData.quizDate}</strong>.
          </p>
          <button 
            onClick={() => {
              setStatus('idle');
              setFormData({ ...formData, teamName: '', fullName: '', quizDate: '' });
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Book Another Table
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className="bg-emerald-900/80 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-emerald-800 shadow-2xl animate-in slide-in-from-right duration-700 delay-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Reserve a Table</h2>
            <p className="text-emerald-400 text-sm">Limited spots available. Book now to secure your place.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Quiz Date */}
            <div className="space-y-1.5">
              <label htmlFor="quizDate" className="text-sm font-medium text-emerald-300">Select Date</label>
              <div className="relative">
                <input
                  required
                  type="date"
                  id="quizDate"
                  name="quizDate"
                  value={formData.quizDate}
                  onChange={handleChange}
                  className="w-full bg-emerald-950 border border-emerald-700 rounded-lg px-4 py-3 text-emerald-100 placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all scheme-dark"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-emerald-300">Leader&apos;s Name</label>
              <input
                required
                type="text"
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-emerald-950 border border-emerald-700 rounded-lg px-4 py-3 text-emerald-100 placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-emerald-300">Email Address</label>
              <input
                required
                type="email"
                id="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-emerald-950 border border-emerald-700 rounded-lg px-4 py-3 text-emerald-100 placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Phone Number Group */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-emerald-300">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative w-1/3">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="w-full appearance-none bg-emerald-950 border border-emerald-700 rounded-lg pl-4 pr-8 py-3 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} ({item.country})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                </div>
                <input
                  required
                  type="tel"
                  name="phoneNumber"
                  placeholder="555-0123"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-2/3 bg-emerald-950 border border-emerald-700 rounded-lg px-4 py-3 text-emerald-100 placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Team Info Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label htmlFor="teamName" className="text-sm font-medium text-emerald-300">Team Name</label>
                <input
                  required
                  type="text"
                  id="teamName"
                  name="teamName"
                  placeholder="The Quizzards"
                  value={formData.teamName}
                  onChange={handleChange}
                  className="w-full bg-emerald-950 border border-emerald-700 rounded-lg px-4 py-3 text-emerald-100 placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label htmlFor="teamSize" className="text-sm font-medium text-emerald-300">Team Size</label>
                <input
                  required
                  type="number"
                  id="teamSize"
                  name="teamSize"
                  min="1"
                  max="10"
                  value={formData.teamSize}
                  onChange={handleChange}
                  className="w-full bg-emerald-950 border border-emerald-700 rounded-lg px-4 py-3 text-emerald-100 placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-linear-to-r from-green-600 to-lime-600 hover:from-green-500 hover:to-lime-500 text-white font-bold py-3.5 px-6 rounded-lg shadow-lg shadow-green-500/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  Confirm Booking
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-emerald-500 mt-4">
              By booking, you agree to our Terms & Privacy Policy.
            </p>
          </form>
        </div>
)
}

export default BookingQuizForm;