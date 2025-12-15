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


function BookingBingoForm({ formData, status, handleSubmit, handleChange}) {
    return (
    <div className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl animate-in slide-in-from-right duration-700 delay-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Reserve a Table</h2>
            <p className="text-slate-400 text-sm">Limited spots available. Book now to secure your place.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Quiz Date */}
            <div className="space-y-1.5">
              <label htmlFor="quizDate" className="text-sm font-medium text-slate-300">Select Date</label>
              <div className="relative">
                <input
                  required
                  type="date"
                  id="quizDate"
                  name="quizDate"
                  value={formData.quizDate}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all scheme-dark"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Full Name */}
               <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label htmlFor="fullName" className="text-sm font-medium text-slate-300">Full Name</label>
                <input
                  required
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label htmlFor="teamSize" className="text-sm font-medium text-slate-300">No. of Tickets</label>
                <input
                  required
                  type="number"
                  id="teamSize"
                  name="teamSize"
                  min="1"
                  max="10"
                  value={formData.teamSize}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">Email Address</label>
              <input
                required
                type="email"
                id="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Phone Number Group */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative w-1/3">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="w-full appearance-none bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-8 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} ({item.country})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <input
                  required
                  type="tel"
                  name="phoneNumber"
                  placeholder="555-0123"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-2/3 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Team Info Row */}
        

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
              className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-lg shadow-lg shadow-indigo-500/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
            
            <p className="text-center text-xs text-slate-500 mt-4">
              By booking, you agree to our Terms & Privacy Policy.
            </p>
          </form>
        </div>
)
}

export default BookingBingoForm;