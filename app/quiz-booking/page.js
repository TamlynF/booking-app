
import { 
  Users, 
  Trophy, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Beer,
  Brain,
  Music,
  ChevronDown
} from 'lucide-react';
import BookingEventInformation from '../_components/BookingEventInformation';
import BookingQuizForm from '../_components/BookingQuizForm';
import { getEvent } from '../_lib/data-service';


/**
 * NOTE FOR NEXT.JS USAGE:
 * 1. Run: npm install @supabase/supabase-js
 * 2. Uncomment the import below:
 * import { createClient } from '@supabase/supabase-js';
 */

// --- CONFIGURATION ---
// Replace these with your actual Supabase project details
//const SUPABASE_URL = "https://your-project.supabase.co";
//const SUPABASE_ANON_KEY = "your-anon-key";

// Initialize Supabase Client (Mocked for this preview to prevent crashing)
// In your real Next.js app, replace `null` with: createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
//const supabase = null; 


async function App() {
  const event = await getEvent(1);
  //console.log(event);
  
  // const [formData, setFormData] = useState({
  //   quizDate: '',
  //   fullName: '',
  //   email: '',
  //   countryCode: '+44',
  //   phoneNumber: '',
  //   teamName: '',
  //   teamSize: '4',
  // });

  // const [status, setStatus] = useState('idle'); // idle, loading, success, error
  // const [errorMessage, setErrorMessage] = useState('');

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: value
  //   }));
  // };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   //setStatus('loading');

  //   // try {
  //   //   if (supabase) {
  //   //     // --- REAL SUPABASE SUBMISSION ---
  //   //     // Ensure your 'bookings' table exists with these columns
  //   //     const { error } = await supabase
  //   //       .from('bookings')
  //   //       .insert([
  //   //         {
  //   //           quiz_date: formData.quizDate,
  //   //           full_name: formData.fullName,
  //   //           email: formData.email,
  //   //           phone: `${formData.countryCode} ${formData.phoneNumber}`,
  //   //           team_name: formData.teamName,
  //   //           team_size: parseInt(formData.teamSize),
  //   //           created_at: new Date().toISOString(),
  //   //         },
  //   //       ]);

  //   //     if (error) throw error;
        
  //   //     setStatus('success');
  //   //   } else {
  //   //     // --- MOCK SUBMISSION FOR DEMO ---
  //   //     console.log("Simulating Supabase Submission:", formData);
  //   //     await new Promise(resolve => setTimeout(resolve, 2000)); // Fake network delay
  //   //     setStatus('success');
  //   //   }
  //   // } catch (error) {
  //   //   console.error('Error booking:', error);
  //   //   setErrorMessage(error.message || 'Something went wrong. Please try again.');
  //   //   setStatus('error');
  //   // }
  //   setStatus('success');
  // };

  // if (status === 'success') {
  //   return (
  //     <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
  //       <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700 animate-in fade-in zoom-in duration-300">
  //         <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
  //           <CheckCircle className="w-10 h-10 text-green-400" />
  //         </div>
  //         <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
  //         <p className="text-slate-400 mb-6">
  //           Get your team ready, <strong>{formData.teamName}</strong>! We&apos;ve booked you in for <strong>{formData.quizDate}</strong>.
  //         </p>
  //         <button 
  //           onClick={() => {
  //             setStatus('idle');
  //             setFormData({ ...formData, teamName: '', fullName: '', quizDate: '' });
  //           }}
  //           className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
  //         >
  //           Book Another Table
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-green-950 text-green-200 font-sans selection:bg-green-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-12 items-center min-h-screen">
        
        {/* Left Side: Event Info */}
        <BookingEventInformation event={event} />

        {/* Right Side: Booking Form */}
        <BookingQuizForm />
      </div>
    </div>
  );
}

export default App;