import { getLogs } from "@/actions/logs";
import { getAllCarsAction } from "@/actions/cars";
import LogTable from "@/components/LogTable";
import CarManager from "@/components/CarManager";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [logs, cars] = await Promise.all([getLogs(), getAllCarsAction()]);

  return (
    <div className="admin-dashboard">
      <h2>Activity Log</h2>
      <LogTable logs={logs} cars={cars} />
      <CarManager cars={cars} />
    </div>
  );
}
