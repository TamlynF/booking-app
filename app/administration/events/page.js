
import { getEvents } from "@/app/_lib/data-service";
import Link from "next/link";
import { formatTimeRange, formatCurrency, formatDate } from "@/app/_utils/helper-functions";

async function Page() {
  const events = await getEvents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-2xl text-lime-950 mb-6">Events</h1>
        <button className="bg-amber-900 text-yellow-100 px-4 py-2 rounded shadow-sm hover:bg-amber-600 transition-colors font-medium">
          Add Event
        </button>
      </div>
      <div className="text-lg text-yellow-600 dark:text-yellow-200 mb-8">All events here</div>
      <hr />
      <div className="border border-yellow-950 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-lime-950 text-yellow-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-3 py-2">Date</th>
                {/* <th className="px-3 py-2">Category</th> */}
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Times</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Seating</th>
                <th className="px-3 py-2">Host</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lime-900 bg-lime-950/35 text-yellow-50">
              {events.map((event) => {

                return (
                  <tr key={event.id} className="hover:bg-lime-900/50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap text-yellow-50">
                      {formatDate(event.date)}
                    </td>

                    {/* <td className="px-3 py-2 whitespace-nowrap text-yellow-50 capitalize">
                      {event.event_types.type}
                    </td> */}
                    <td className="px-3 py-2 whitespace-nowrap text-yellow-50 capitalize">
                      {event.event_types.sub_type}
                    </td>
                    <td className="px-3 py-2 max-w-40 truncate text-yellow-50">
                      {event.title}
                    </td>
                    <td className="px-3 py-2 max-w-80 truncate text-yellow-50" title={event.description}>
                      {event.description}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-yellow-50">
                      {formatTimeRange(event.date, event.start_time, event.end_time)}
                    </td>

                    <td className={`px-3 py-2 whitespace-nowrap text-yellow-50 ${event.payment_amount === 0 ? 'text-center' : 'text-right'}`}>
                      {formatCurrency(event.payment_amount)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <div className={`inline-flex items-center justify-center w-5 h-5 rounded border ${event.seating_required
                          ? "bg-green-500 border-green-900"
                          : "border-green-900 bg-transparent"
                        }`}>
                        {event.seating_required && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-yellow-950">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-yellow-50">
                      {event.employees?.full_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-yellow-400 hover:text-yellow-300 transition-colors mr-4">
                        Edit
                      </button>
                      <button className="text-red-400 hover:text-red-300 transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {events.map(event => (
          <li key={event.id}>
            <Link href={`/events/${event.id}`} className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{event.title}
              <div className="text-gray-400 text-sm mt-2">{event.date}</div>
            </Link>
          </li>
        ))}
      </ul> */}
    </div>
  );
}

export default Page;