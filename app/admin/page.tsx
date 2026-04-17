"use client";

import { useEffect, useState } from "react";
import { getLogs } from "@/actions/logs";
import { getAllCarsAction } from "@/actions/cars";
import LogTable from "@/components/LogTable";
import CarManager from "@/components/CarManager";
import type { LogEntry, LoanCar } from "@/lib/types";

export default function AdminDashboardPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cars, setCars] = useState<LoanCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refetchData() {
    try {
      const [logsData, carsData] = await Promise.all([getLogs(), getAllCarsAction()]);
      setLogs(logsData);
      setCars(carsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [logsData, carsData] = await Promise.all([getLogs(), getAllCarsAction()]);
        setLogs(logsData);
        setCars(carsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;
  if (error) return <div className="admin-dashboard"><p className="error-text">Error: {error}</p></div>;

  return (
    <div className="admin-dashboard">
      <h2>Activity Log</h2>
      <LogTable logs={logs} cars={cars} />
      <CarManager cars={cars} onUpdate={refetchData} />
    </div>
  );
}
