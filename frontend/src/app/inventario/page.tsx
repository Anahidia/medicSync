'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Package,
  AlertTriangle,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  History,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function InventoryPage() {
  const { user, role, permissions } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalItems: 0, lowStockCount: 0, expiringCount: 0 });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [alertOnlyFilter, setAlertOnlyFilter] = useState(false);
  const [activeTab, setActiveTab] = useState<'insumos' | 'movimientos'>('insumos');

  // Modales
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItemForMove, setSelectedItemForMove] = useState<any>(null);

  // Formulario nuevo insumo
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    code: '',
    category: 'DESCARTABLE',
    unit: 'unidad',
    minStockAlert: '15',
    initialStock: '50',
    location: 'Depósito Central',
    batchNumber: 'LOT-2026-01',
    expirationDate: '',
  });

  // Formulario de movimiento
  const [movementForm, setMovementForm] = useState({
    itemId: '',
    type: 'EGRESO_GUARDIA',
    quantity: '1',
    reference: '',
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (alertOnlyFilter) params.append('alertOnly', 'true');

      const res = await fetch(`/api/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setMetrics(data.metrics || { totalItems: 0, lowStockCount: 0, expiringCount: 0 });
      }

      const resMov = await fetch('/api/inventory/movements');
      if (resMov.ok) {
        const dataMov = await resMov.json();
        setMovements(dataMov.movements || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, alertOnlyFilter]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItemForm),
      });

      if (res.ok) {
        setShowNewItemModal(false);
        setNewItemForm({
          name: '',
          code: '',
          category: 'DESCARTABLE',
          unit: 'unidad',
          minStockAlert: '15',
          initialStock: '50',
          location: 'Depósito Central',
          batchNumber: 'LOT-2026-01',
          expirationDate: '',
        });
        fetchInventory();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al registrar insumo');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementForm),
      });

      if (res.ok) {
        setShowMovementModal(false);
        setMovementForm({
          itemId: '',
          type: 'EGRESO_GUARDIA',
          quantity: '1',
          reference: '',
        });
        fetchInventory();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al registrar movimiento');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Package className="w-6 h-6 text-sky-600 mr-2" />
            Inventario de Insumos y Farmacia
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de stock de descartables, trazabilidad de lotes, vencimientos y alertas de reposición
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (items.length > 0) {
                setMovementForm({ ...movementForm, itemId: items[0].id });
              }
              setShowMovementModal(true);
            }}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            <span>Mover Stock</span>
          </button>

          <button
            onClick={() => setShowNewItemModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Alerta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total de Artículos</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{metrics.totalItems}</span>
            <span className="text-xs text-slate-500">insumos catalogados</span>
          </div>
        </div>

        {/* Alerta de Stock Bajo */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Alertas de Stock Bajo</span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-950">{metrics.lowStockCount}</span>
            <span className="text-xs font-bold text-rose-800">por debajo del mínimo</span>
          </div>
        </div>

        {/* Alerta de Vencimientos */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Próximos a Vencer</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-950">{metrics.expiringCount}</span>
            <span className="text-xs font-bold text-amber-800">lotes dentro de 60 días</span>
          </div>
        </div>
      </div>

      {/* Pestañas: Insumos vs Historial de Movimientos */}
      <div className="flex border-b border-slate-200 space-x-1">
        <button
          onClick={() => setActiveTab('insumos')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'insumos'
              ? 'bg-white text-sky-700 border-t-2 border-x border-slate-200 -mb-px'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Insumos y Farmacia ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movimientos')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'movimientos'
              ? 'bg-white text-sky-700 border-t-2 border-x border-slate-200 -mb-px'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Movimientos ({movements.length})</span>
        </button>
      </div>

      {activeTab === 'insumos' ? (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">Categoría:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Todas las categorías</option>
                <option value="DESCARTABLE">Descartables</option>
                <option value="MEDICAMENTO">Medicamentos / Fármacos</option>
                <option value="MATERIAL_CURACION">Material de Curación</option>
                <option value="SOLUCION">Soluciones y Sueros</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={alertOnlyFilter}
                onChange={(e) => setAlertOnlyFilter(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="font-bold text-rose-700">Ver solo alertas críticas</span>
            </label>
          </div>

          {/* Tabla de Insumos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="py-3 px-4">Insumo / Descripción</th>
                    <th className="py-3 px-4">Código SKU</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Ubicación</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                    <th className="py-3 px-4 text-center">Mínimo Alerta</th>
                    <th className="py-3 px-4">Lotes y Vencimientos</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Cargando inventario...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No se encontraron insumos con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400">Unidad: {item.unit}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {item.code}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.location || 'Depósito Central'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block font-mono font-black text-sm px-2.5 py-0.5 rounded-lg ${
                              item.isLowStock
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                          {item.isLowStock && (
                            <span className="block text-[9px] uppercase font-bold text-rose-600 mt-0.5">
                              ⚠️ Reponer urgente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {item.minStockAlert} {item.unit}
                        </td>
                        <td className="py-3 px-4">
                          {item.batches && item.batches.length > 0 ? (
                            <div className="space-y-1">
                              {item.batches.map((b: any) => (
                                <div key={b.id} className="text-[11px] font-mono text-slate-600">
                                  <span>{b.batchNumber}: </span>
                                  <span
                                    className={
                                      new Date(b.expirationDate) < new Date()
                                        ? 'text-rose-600 font-bold'
                                        : 'text-slate-700'
                                    }
                                  >
                                    Vence {formatDate(b.expirationDate)}
                                  </span>
                                  <span className="text-slate-400"> ({b.remainingQuantity} u.)</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Sin lote asignado</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setMovementForm({ ...movementForm, itemId: item.id });
                              setShowMovementModal(true);
                            }}
                            className="text-xs text-sky-600 hover:text-sky-800 font-bold hover:underline cursor-pointer"
                          >
                            Ajustar / Retirar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Pestaña: Historial de Movimientos */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Auditoría de Ingresos y Egresos</h2>
            <p className="text-xs text-slate-500">Registro histórico de insumos consumidos en consultorio o guardia</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Insumo</th>
                  <th className="py-3 px-4">Tipo Movimiento</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4">Referencia / Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No hay movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">
                        {m.item.name} ({m.item.code})
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            m.type === 'INGRESO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-black font-mono">
                        {m.type === 'INGRESO' ? `+${m.quantity}` : `-${m.quantity}`} {m.item.unit}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {m.user ? `${m.user.name} (${m.user.role})` : 'Sistema'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 italic">
                        {m.reference || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Insumo */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
              <Package className="w-5 h-5 text-sky-600 mr-2" />
              Alta de Insumo o Medicamento
            </h2>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Insumo / Fármaco *</label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="Ej: Gasas Estériles 10x10..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código / SKU *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.code}
                    onChange={(e) => setNewItemForm({ ...newItemForm, code: e.target.value })}
                    placeholder="GAS-1010"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría *</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="DESCARTABLE">Descartable</option>
                    <option value="MEDICAMENTO">Medicamento / Fármaco</option>
                    <option value="MATERIAL_CURACION">Material de Curación</option>
                    <option value="SOLUCION">Solución o Suero</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidad</label>
                  <input
                    type="text"
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    placeholder="unidad, caja..."
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={newItemForm.initialStock}
                    onChange={(e) => setNewItemForm({ ...newItemForm, initialStock: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mínimo Alerta</label>
                  <input
                    type="number"
                    value={newItemForm.minStockAlert}
                    onChange={(e) => setNewItemForm({ ...newItemForm, minStockAlert: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ubicación Física</label>
                <input
                  type="text"
                  value={newItemForm.location}
                  onChange={(e) => setNewItemForm({ ...newItemForm, location: e.target.value })}
                  placeholder="Estante A3, Carro de Paro..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° de Lote Inicial</label>
                  <input
                    type="text"
                    value={newItemForm.batchNumber}
                    onChange={(e) => setNewItemForm({ ...newItemForm, batchNumber: e.target.value })}
                    placeholder="LOT-2026-X"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={newItemForm.expirationDate}
                    onChange={(e) => setNewItemForm({ ...newItemForm, expirationDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewItemModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Guardar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Movimiento */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
              <ArrowDownRight className="w-5 h-5 text-sky-600 mr-2" />
              Registrar Movimiento de Stock
            </h2>

            <form onSubmit={handleCreateMovement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Insumo a Mover *</label>
                <select
                  required
                  value={movementForm.itemId}
                  onChange={(e) => setMovementForm({ ...movementForm, itemId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="">-- Seleccionar insumo --</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Movimiento *</label>
                <select
                  value={movementForm.type}
                  onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                >
                  <option value="EGRESO_GUARDIA">Egreso por Guardia / Shockroom</option>
                  <option value="EGRESO_CONSULTA">Egreso por Atención en Consultorio</option>
                  <option value="INGRESO">Ingreso / Compra a Proveedor (+)</option>
                  <option value="AJUSTE_MERMA">Ajuste por Merma, Rotura o Vencimiento</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Referencia / Motivo / Paciente</label>
                <input
                  type="text"
                  value={movementForm.reference}
                  onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })}
                  placeholder="Ej: Box 2 curación, guardia noche, factura #120..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
