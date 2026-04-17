"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleCarStatus, addCar, deleteCar, updateCar, setCarMaintenance } from "@/actions/cars";
import type { LoanCar } from "@/lib/types";

interface CarManagerProps {
  cars: LoanCar[];
  onUpdate?: () => void;
}

export default function CarManager({ cars, onUpdate }: CarManagerProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ make: "", model: "", colour: "", plateNumber: "" });
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCar, setNewCar] = useState({ make: "", model: "", colour: "", plateNumber: "" });

  async function handleToggle(carId: number) {
    setTogglingId(carId);
    try { await toggleCarStatus(carId); router.refresh(); onUpdate?.(); }
    catch { alert("Failed to toggle car status."); }
    finally { setTogglingId(null); }
  }

  async function handleSetMaintenance(carId: number, maintenance: boolean) {
    setTogglingId(carId);
    try { await setCarMaintenance(carId, maintenance); router.refresh(); onUpdate?.(); }
    catch { alert("Failed to update maintenance status."); }
    finally { setTogglingId(null); }
  }

  async function handleDelete(carId: number) {
    if (!confirm("Delete this car? All related log entries will also be removed.")) return;
    setDeletingId(carId);
    try { await deleteCar(carId); router.refresh(); onUpdate?.(); }
    catch { alert("Failed to delete car."); }
    finally { setDeletingId(null); }
  }

  function startEdit(car: LoanCar) {
    setEditingId(car.id);
    setEditData({ make: car.make, model: car.model, colour: car.colour ?? "", plateNumber: car.plateNumber ?? "" });
  }

  async function saveEdit(carId: number) {
    if (!editData.make || !editData.model) { alert("Make and Model are required."); return; }
    setSaving(true);
    try {
      await updateCar(carId, {
        make: editData.make,
        model: editData.model,
        colour: editData.colour || null,
        plateNumber: editData.plateNumber || null,
      });
      setEditingId(null);
      router.refresh();
      onUpdate?.();
    } catch { alert("Failed to update car."); }
    finally { setSaving(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newCar.make || !newCar.model) { alert("Make and Model are required."); return; }
    setAdding(true);
    try {
      await addCar({ make: newCar.make, model: newCar.model, colour: newCar.colour || null, plateNumber: newCar.plateNumber || null });
      setNewCar({ make: "", model: "", colour: "", plateNumber: "" });
      setShowAddForm(false);
      router.refresh();
      onUpdate?.();
    } catch { alert("Failed to add car."); }
    finally { setAdding(false); }
  }

  return (
    <div className="car-manager">
      <div className="car-manager__header">
        <h3>Fleet Management</h3>
        <button type="button" className="big-button big-button--primary" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? "Cancel" : "Add Car"}
        </button>
      </div>

      {showAddForm && (
        <form className="car-manager__add-form" onSubmit={handleAdd}>
          <div className="form-field"><label htmlFor="new-make">Make *</label><input id="new-make" type="text" value={newCar.make} onChange={(e) => setNewCar({ ...newCar, make: e.target.value })} required /></div>
          <div className="form-field"><label htmlFor="new-model">Model *</label><input id="new-model" type="text" value={newCar.model} onChange={(e) => setNewCar({ ...newCar, model: e.target.value })} required /></div>
          <div className="form-field"><label htmlFor="new-colour">Colour</label><input id="new-colour" type="text" value={newCar.colour} onChange={(e) => setNewCar({ ...newCar, colour: e.target.value })} /></div>
          <div className="form-field"><label htmlFor="new-plate">Plate Number</label><input id="new-plate" type="text" value={newCar.plateNumber} onChange={(e) => setNewCar({ ...newCar, plateNumber: e.target.value })} /></div>
          <button type="submit" className="big-button big-button--primary" disabled={adding}>{adding ? "Adding…" : "Add Car"}</button>
        </form>
      )}

      <table className="car-manager__table">
        <thead>
          <tr><th>Car</th><th>Plate</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id}>
              {editingId === car.id ? (
                <>
                  <td colSpan={4} className="car-manager__edit-cell">
                    <div className="car-manager__edit-form">
                      <div className="form-field"><label>Make</label><input type="text" value={editData.make} onChange={(e) => setEditData({ ...editData, make: e.target.value })} /></div>
                      <div className="form-field"><label>Model</label><input type="text" value={editData.model} onChange={(e) => setEditData({ ...editData, model: e.target.value })} /></div>
                      <div className="form-field"><label>Colour</label><input type="text" value={editData.colour} onChange={(e) => setEditData({ ...editData, colour: e.target.value })} /></div>
                      <div className="form-field"><label>Plate</label><input type="text" value={editData.plateNumber} onChange={(e) => setEditData({ ...editData, plateNumber: e.target.value })} /></div>
                      <div className="car-manager__edit-actions">
                        <button type="button" className="big-button big-button--primary" onClick={() => saveEdit(car.id)} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                        <button type="button" className="big-button big-button--secondary" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td>{car.make} {car.model}{car.colour ? ` (${car.colour})` : ""}</td>
                  <td>{car.plateNumber ?? "—"}</td>
                  <td><span className={`car-manager__status car-manager__status--${car.status}`}>{car.status === "available" ? "Available" : car.status === "maintenance" ? "Maintenance" : "In Use"}</span></td>
                  <td className="car-manager__actions">
                    <button type="button" className="log-table__btn log-table__btn--edit" onClick={() => startEdit(car)} aria-label={`Edit ${car.make} ${car.model}`}>Edit</button>
                    {car.status === "available" && (
                      <>
                        <button type="button" className="big-button big-button--secondary car-manager__toggle" onClick={() => handleToggle(car.id)} disabled={togglingId === car.id}>{togglingId === car.id ? "…" : "Set In Use"}</button>
                        <button type="button" className="big-button big-button--secondary car-manager__toggle" onClick={() => handleSetMaintenance(car.id, true)} disabled={togglingId === car.id}>{togglingId === car.id ? "…" : "Set Maintenance"}</button>
                      </>
                    )}
                    {car.status === "in_use" && (
                      <button type="button" className="big-button big-button--secondary car-manager__toggle" onClick={() => handleToggle(car.id)} disabled={togglingId === car.id}>{togglingId === car.id ? "…" : "Set Available"}</button>
                    )}
                    {car.status === "maintenance" && (
                      <button type="button" className="big-button big-button--secondary car-manager__toggle" onClick={() => handleSetMaintenance(car.id, false)} disabled={togglingId === car.id}>{togglingId === car.id ? "…" : "Set Available"}</button>
                    )}
                    <button type="button" className="log-table__btn log-table__btn--delete" onClick={() => handleDelete(car.id)} disabled={deletingId === car.id} aria-label={`Delete ${car.make} ${car.model}`}>{deletingId === car.id ? "…" : "Delete"}</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
