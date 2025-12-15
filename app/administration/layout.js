import SideNavigation from "@/app/_components/SideNavigation";

export default function Layout({ children }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] h-full gap-4">
      <SideNavigation />
      <div className="py-1">{children}</div>
    </div>
  );
}