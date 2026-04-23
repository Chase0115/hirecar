"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLogEntry, deleteLogEntry, createManualLogEntry } from "@/actions/logs";
import type { LogEntry, LoanCar, ManualLogInput } from "@/lib/types";

interface LogTableProps {
  logs: LogEntry[];
  cars: LoanCar[];
}

export default function LogTable({ logs, cars }: LogTableProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<LogEntry>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState<ManualLogInput>({
    action: "pickup",
    customerName: "",
    phoneNumber: "",
    customerPlateNumber: "",
    loanCarId: cars[0]?.id ?? 0,
  });
  const [manualSaving, setManualSaving] = useState(false);

  function handleRowClick(id: number) {
    if (editingId === id) return;
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function formatTimestamp(date: Date): string {
    return new Date(date).toLocaleString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatAction(action: string): string {
    return action === "pickup" ? "Pick Up" : "Drop Off";
  }

  function startEdit(log: LogEntry, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(log.id);
    setEditData({
      action: log.action,
      customerName: log.customerName,
      phoneNumber: log.phoneNumber,
      customerPlateNumber: log.customerPlateNumber,
      loanCarId: log.loanCarId,
    });
  }

  function cancelEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(null);
    setEditData({});
  }

  async function saveEdit(logId: number, e: React.MouseEvent) {
    e.stopPropagation();
    setSaving(true);
    try {
      await updateLogEntry(logId, editData);
      setEditingId(null);
      setEditData({});
      router.refresh();
    } catch {
      alert("Failed to update log entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(logId: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this log entry?")) return;
    setDeleting(logId);
    try {
      await deleteLogEntry(logId);
      router.refresh();
    } catch {
      alert("Failed to delete log entry.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualData.customerName || !manualData.phoneNumber || !manualData.loanCarId) {
      alert("Please fill in all required fields.");
      return;
    }
    setManualSaving(true);
    try {
      await createManualLogEntry(manualData);
      setShowManualForm(false);
      setManualData({
        action: "pickup",
        customerName: "",
        phoneNumber: "",
        customerPlateNumber: "",
        loanCarId: cars[0]?.id ?? 0,
      });
      router.refresh();
    } catch {
      alert("Failed to create manual entry.");
    } finally {
      setManualSaving(false);
    }
  }

  function getCarLabel(loanCarId: number): string {
    const car = cars.find((c) => c.id === loanCarId);
    return car ? `${car.make} ${car.model}${car.plateNumber ? ` (${car.plateNumber})` : ""}` : "Unknown";
  }

  return (
    <div className="log-table-wrapper">
      <div className="log-table-actions">
        <button
          type="button"
          className="big-button big-button--primary"
          onClick={() => setShowManualForm((v) => !v)}
        >
          {showManualForm ? "Cancel" : "Add Manual Entry"}
        </button>
      </div>

      {showManualForm && (
        <form className="manual-entry-form" onSubmit={handleManualSubmit}>
          <h3>Add Manual Entry</h3>
          <div className="manual-entry-form__fields">
            <div className="form-field">
              <label htmlFor="manual-action">Action</label>
              <select
                id="manual-action"
                value={manualData.action}
                onChange={(e) =>
                  setManualData({ ...manualData, action: e.target.value as "pickup" | "dropoff" })
                }
              >
                <option value="pickup">Pick Up</option>
                <option value="dropoff">Drop Off</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="manual-name">Customer Name *</label>
              <input
                id="manual-name"
                type="text"
                value={manualData.customerName}
                onChange={(e) => setManualData({ ...manualData, customerName: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="manual-phone">Phone Number *</label>
              <input
                id="manual-phone"
                type="tel"
                value={manualData.phoneNumber}
                onChange={(e) => setManualData({ ...manualData, phoneNumber: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="manual-plate">Customer Plate Number</label>
              <input
                id="manual-plate"
                type="text"
                value={manualData.customerPlateNumber ?? ""}
                onChange={(e) => setManualData({ ...manualData, customerPlateNumber: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="manual-car">Loan Car *</label>
              <select
                id="manual-car"
                value={manualData.loanCarId}
                onChange={(e) => setManualData({ ...manualData, loanCarId: Number(e.target.value) })}
                required
              >
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.make} {car.model} {car.plateNumber ? `(${car.plateNumber})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="big-button big-button--primary"
            disabled={manualSaving}
          >
            {manualSaving ? "Saving…" : "Create Entry"}
          </button>
        </form>
      )}

      {logs.length === 0 ? (
        <p className="log-table-empty">No log entries found.</p>
      ) : (
        <table className="log-table" role="grid">
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Action</th>
              <th scope="col">Car</th>
              <th scope="col">Customer Name</th>
              <th scope="col">Phone Number</th>
              <th scope="col">Plate Number</th>
              <th scope="col">Controls</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="log-table__group">
                <td colSpan={7} style={{ padding: 0, border: "none" }}>
                  {editingId === log.id ? (
                    <div className="log-table__edit-row">
                      <div className="log-table__edit-fields">
                        <div className="form-field">
                          <label htmlFor={`edit-action-${log.id}`}>Action</label>
                          <select
                            id={`edit-action-${log.id}`}
                            value={editData.action ?? log.action}
                            onChange={(e) =>
                              setEditData({ ...editData, action: e.target.value as "pickup" | "dropoff" })
                            }
                          >
                            <option value="pickup">Pick Up</option>
                            <option value="dropoff">Drop Off</option>
                          </select>
                        </div>
                        <div className="form-field">
                          <label htmlFor={`edit-name-${log.id}`}>Name</label>
                          <input
                            id={`edit-name-${log.id}`}
                            type="text"
                            value={editData.customerName ?? log.customerName}
                            onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor={`edit-phone-${log.id}`}>Phone</label>
                          <input
                            id={`edit-phone-${log.id}`}
                            type="tel"
                            value={editData.phoneNumber ?? log.phoneNumber}
                            onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor={`edit-plate-${log.id}`}>Plate</label>
                          <input
                            id={`edit-plate-${log.id}`}
                            type="text"
                            value={editData.customerPlateNumber ?? log.customerPlateNumber ?? ""}
                            onChange={(e) =>
                              setEditData({ ...editData, customerPlateNumber: e.target.value || null })
                            }
                          />
                        </div>
                      </div>
                      <div className="log-table__edit-actions">
                        <button
                          type="button"
                          className="big-button big-button--primary"
                          onClick={(e) => saveEdit(log.id, e)}
                          disabled={saving}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          className="big-button big-button--secondary"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`log-table__row ${expandedId === log.id ? "log-table__row--expanded" : ""}`}
                      >
                        <span
                          className="log-table__cell"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleRowClick(log.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleRowClick(log.id); }}
                          aria-expanded={expandedId === log.id}
                          aria-controls={`log-detail-${log.id}`}
                        >
                          {formatTimestamp(log.createdAt)}
                        </span>
                        <span className="log-table__cell" onClick={() => handleRowClick(log.id)}>{formatAction(log.action)}</span>
                        <span className="log-table__cell" onClick={() => handleRowClick(log.id)}>{getCarLabel(log.loanCarId)}</span>
                        <span className="log-table__cell" onClick={() => handleRowClick(log.id)}>{log.customerName}</span>
                        <span className="log-table__cell" onClick={() => handleRowClick(log.id)}>{log.phoneNumber}</span>
                        <span className="log-table__cell" onClick={() => handleRowClick(log.id)}>{log.customerPlateNumber ?? "—"}</span>
                        <span className="log-table__cell log-table__controls">
                          <button
                            type="button"
                            className="log-table__btn log-table__btn--edit"
                            onClick={(e) => startEdit(log, e)}
                            aria-label={`Edit log entry for ${log.customerName}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="log-table__btn log-table__btn--delete"
                            onClick={(e) => handleDelete(log.id, e)}
                            disabled={deleting === log.id}
                            aria-label={`Delete log entry for ${log.customerName}`}
                          >
                            {deleting === log.id ? "…" : "Delete"}
                          </button>
                        </span>
                      </div>
                      {expandedId === log.id && (
                        <div
                          id={`log-detail-${log.id}`}
                          className="log-table__detail"
                          role="region"
                          aria-label={`License photo for ${log.customerName}`}
                        >
                          {log.licensePhotoUrl ? (
                            <img
                              src={log.licensePhotoUrl}
                              alt={`License photo for ${log.customerName}`}
                              className="log-table__license-photo"
                            />
                          ) : (
                            <p className="log-table__no-photo">No license photo available.</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
