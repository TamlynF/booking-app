import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="z-10 text-xl">
      <ul className="flex gap-16 items-center">
        <li>
          <Link href="/quiz-booking" className="hover:text-accent-400 transition-colors">
            Quiz Bookings
          </Link>
        </li>
        <li>
          <Link href="/cabins" className="hover:text-accent-400 transition-colors">
            Whats On
          </Link>
        </li>
        <li>
          <Link href="/about" className="hover:text-accent-400 transition-colors">
            About
          </Link>
        </li>
        <li>
          <Link
            href="/administration"
            className="hover:text-accent-400 transition-colors"
          >
            Admin
          </Link>
        </li>
      </ul>
    </nav>
  );
}
