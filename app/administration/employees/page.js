import { SortableTable } from "@/app/_components/SortableTable";
import { DefaultTable } from "@/app/_components/Table";

export default function Page() {
  return (
    <>
    <h2 className="font-semibold text-2xl text-accent-400 mb-7">
      Employees
      </h2>
      {/* <DefaultTable /> */}
      <SortableTable />
      </>
  );
}