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

import BookingInfoCard from "./BookingInfoCard";
import { getEventInfo } from '../_lib/data-service';

const iconMap = {
  "Users": Users,
  "Trophy": Trophy,
  "Calendar": Calendar,
  "MapPin": MapPin,
  "CheckCircle": CheckCircle,
  "AlertCircle": AlertCircle,
  "Loader2": Loader2,
  "Beer": Beer,
  "Brain": Brain,
  "Music": Music,
  "ChevronDown": ChevronDown
};

async function BookingEventInformation({ event }) {
    const { id, date, start_time, end_time, title, description, event_types_id } = event;
    const eventInfo = await getEventInfo(event_types_id);
    let eventCards = [];
    if (eventInfo)
        eventCards = eventInfo.map((info) => {
            const IconComponent = iconMap[info.icon] || AlertCircle;
            return (
                <BookingInfoCard
                    key={info.id}
                    icon={IconComponent}
                    title={info.title}
                    desc={info.description}
                />
            );           
        });


    return (
        <div className="space-y-8 pr-0 md:pr-8 animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-sm font-medium">
                <Trophy className="w-4 h-4" />
                <span>Weekly Championship Series</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
                Thursday <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-green-400 to-lime-400">
                    {title}
                </span>
            </h1>

            <p className="text-lg text-emerald-400 leading-relaxed max-w-lg">
                {description}
            </p>

            <div className="grid grid-cols-2 gap-4">
                {eventCards}
            </div>

            <div className="flex gap-4 pt-4 text-sm text-green-500 font-medium uppercase tracking-wider">
                <span className="flex items-center gap-1"><Brain className="w-4 h-4" /> Trivia</span>
                <span className="w-1 h-1 bg-green-700 rounded-full self-center"></span>
                <span className="flex items-center gap-1"><Music className="w-4 h-4" /> Music</span>
                <span className="w-1 h-1 bg-green-700 rounded-full self-center"></span>
                <span className="flex items-center gap-1"><Beer className="w-4 h-4" /> Drinks</span>
            </div>
        </div>
    );
}

export default BookingEventInformation;