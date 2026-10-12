'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Code2,
  Bell,
  MessageSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function AutomationPage() {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string; data?: any }>>([
    {
      sender: 'bot',
      text: '¡Hola! 👋 Soy MediBot, el asistente virtual con IA de MediSync. Puedo ayudarte a consultar disponibilidad médica, agendar un turno o cancelar una cita. ¿Qué especialidad o profesional necesitas?',
      time: '10:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Recordatorios automáticos
  const [reminders, setReminders] = useState<any[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const fetchReminders = async () => {
    try {
      setLoadingReminders(true);
      const res = await fetch('/api/bot/reminders');
      if (res.ok) {
        const data = await res.json();
        setReminders(data.pendingReminders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleSimulateDispatchReminders = async () => {
    if (reminders.length === 0) return;
    try {
      setDispatchStatus('Despachando recordatorios vía Webhook...');
      const ids = reminders.map((r) => r.appointmentId);
      const res = await fetch('/api/bot/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentIds: ids }),
      });
      if (res.ok) {
        setDispatchStatus(`¡Éxito! Se despacharon ${ids.length} recordatorios automáticos de 24 horas antes.`);
        await fetchReminders();
      }
    } catch (e) {
      setDispatchStatus('Error al despachar recordatorios.');
    }
  };

  const handleBotSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsBotThinking(true);

    try {
      const lower = text.toLowerCase();

      // Caso 1: Consulta de disponibilidad
      if (lower.includes('cardio') || lower.includes('turno') || lower.includes('disponib') || lower.includes('pediat')) {
        let spec = '';
        if (lower.includes('cardio')) spec = 'Cardiología';
        if (lower.includes('pediat')) spec = 'Pediatría';

        const res = await fetch(`/api/bot/check-availability${spec ? `?specialty=${spec}` : ''}`);
        const data = await res.json();

        if (data.available && data.availableSlots?.length > 0) {
          const slots = data.availableSlots.slice(0, 3);
          const responseText = `Encontré los siguientes turnos disponibles con nuestros profesionales:\n\n${slots
            .map(
              (s: any, idx: number) =>
                `👉 Opción ${idx + 1}: ${s.doctorName} (${s.specialty}) - Fecha: ${s.timeFormatted}`
            )
            .join('\n')}\n\n¿Deseas confirmar alguno? Responde con tu DNI, Nombre y el número de opción.`;

          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: responseText,
              time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
              data: slots,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: 'Lo siento, no encontré turnos libres en los próximos días para esa especialidad.',
              time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      }
      // Caso 2: Agendamiento
      else if (lower.includes('agendar') || lower.includes('confirmar') || lower.includes('dni')) {
        // Obtenemos los doctores para tomar el primer médico disponible
        const docRes = await fetch('/api/appointments');
        const docData = await docRes.json();
        const doc = docData.doctors?.[0];

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 2);
        targetDate.setHours(10, 0, 0, 0);

        const bookRes = await fetch('/api/bot/book-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: '40123456',
            firstName: 'Juan Ignacio',
            lastName: 'Pérez',
            phone: '+54 9 11 2345-6789',
            doctorId: doc?.id,
            dateTime: targetDate.toISOString(),
            reason: 'Consulta programada vía Asistente Virtual MediBot (n8n)',
          }),
        });

        const bookData = await bookRes.json();

        if (bookData.success) {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `✅ ${bookData.message}\n\nDetalles del Turno:\n• Fecha: ${targetDate.toLocaleDateString('es-AR')} a las 10:00 hs\n• Consultorio: Consultorio Asignado\n• ID de Turno: ${bookData.appointmentId?.slice(0, 8)}\n\nTe enviaremos un recordatorio 24 horas antes por este medio. ¡Muchas gracias!`,
              time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `Disculpa, hubo un problema al agendar: ${bookData.error || 'Horario no disponible'}.`,
              time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      }
      // Caso 3: Cancelar turno
      else if (lower.includes('cancelar')) {
        const cancelRes = await fetch('/api/bot/cancel-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: '40123456' }),
        });
        const cancelData = await cancelRes.json();

        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: cancelData.success
              ? '✅ Tu turno ha sido cancelado con éxito en el sistema de la clínica. El horario fue liberado para otros pacientes.'
              : `Aviso: ${cancelData.error || 'No se encontró un turno activo para cancelar'}.`,
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'Puedo ayudarte a:\n1. 🔍 Consultar disponibilidad (ej: "Turnos con Cardiología")\n2. 📅 Agendar una cita (ej: "Agendar turno")\n3. ❌ Cancelar una cita (ej: "Cancelar turno")\n\n¿Qué prefieres hacer?',
            time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Error de conexión con la API de MediSync. Intenta nuevamente.',
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsBotThinking(false);
    }
  };

  const downloadN8nWorkflow = () => {
    const workflow = {
      name: 'MediSync - Flujo WhatsApp & IA n8n',
      nodes: [
        {
          name: 'WhatsApp Webhook Trigger',
          type: 'n8n-nodes-base.webhook',
          position: [100, 300],
          parameters: { path: 'whatsapp-incoming', httpMethod: 'POST' },
        },
        {
          name: 'AI Agent LangChain Router',
          type: '@n8n/n8n-nodes-langchain.agent',
          position: [350, 300],
          parameters: { promptType: 'define', text: '={{ $json.body.message }}' },
        },
        {
          name: 'MediSync Tool: Check Availability',
          type: 'n8n-nodes-base.httpRequest',
          position: [600, 200],
          parameters: { url: 'http://localhost:3000/api/bot/check-availability', method: 'GET' },
        },
        {
          name: 'MediSync Tool: Book Appointment',
          type: 'n8n-nodes-base.httpRequest',
          position: [600, 350],
          parameters: { url: 'http://localhost:3000/api/bot/book-appointment', method: 'POST' },
        },
        {
          name: 'MediSync Tool: Cancel Appointment',
          type: 'n8n-nodes-base.httpRequest',
          position: [600, 500],
          parameters: { url: 'http://localhost:3000/api/bot/cancel-appointment', method: 'POST' },
        },
        {
          name: 'Cron Trigger 24h Reminders',
          type: 'n8n-nodes-base.cron',
          position: [100, 700],
          parameters: { triggerTimes: { item: [{ hour: 8, minute: 0 }] } },
        },
        {
          name: 'Fetch Pending Reminders',
          type: 'n8n-nodes-base.httpRequest',
          position: [350, 700],
          parameters: { url: 'http://localhost:3000/api/bot/reminders', method: 'GET' },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medisync-n8n-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Bot className="w-6 h-6 text-emerald-600 mr-2" />
            Automatización de Recepción & Agente IA (n8n)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Webhooks de autoservicio para pacientes, simulador de IA y despachador de recordatorios de 24h
          </p>
        </div>

        <button
          onClick={downloadN8nWorkflow}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center space-x-1.5 self-start cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Descargar Template n8n (.json)</span>
        </button>
      </div>

      {/* Grid Principal: Simulador de Bot a la Izquierda, Recordatorios y Endpoints a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda (7 cols): Simulador de Chat del Bot de IA */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[650px] overflow-hidden">
          {/* Cabecera del Simulador */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold flex items-center">
                  <span>MediBot IA — Simulador de WhatsApp</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ml-2 animate-ping"></span>
                </h2>
                <p className="text-[11px] text-slate-400">Conectado a la base de datos de MediSync en tiempo real</p>
              </div>
            </div>
          </div>

          {/* Botones de Prueba Rápida */}
          <div className="bg-slate-50 border-b border-slate-100 p-2.5 flex flex-wrap gap-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 self-center mr-1">Pruebas rápidas:</span>
            <button
              onClick={() => handleBotSendMessage('¿Tienen turnos disponibles para Cardiología?')}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer"
            >
              📅 Consultar Cardiología
            </button>
            <button
              onClick={() => handleBotSendMessage('Deseo confirmar y agendar un turno para Juan Pérez')}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer"
            >
              ✅ Agendar Turno
            </button>
            <button
              onClick={() => handleBotSendMessage('Quiero cancelar mi turno pendiente')}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer"
            >
              ❌ Cancelar Cita
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs whitespace-pre-line leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-2xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-2xs'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1.5 text-right font-mono ${
                      m.sender === 'user' ? 'text-sky-200' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {isBotThinking && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] font-medium">MediBot consultando base de datos...</span>
                </div>
              </div>
            )}
          </div>

          {/* Formulario de Envío de Mensaje */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBotSendMessage(inputText);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe como un paciente: ej. '¿Hay turnos libres?'..."
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha (5 cols): Despacho de Recordatorios 24h y Endpoints n8n */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Recordatorios de 24h */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Recordatorios Automáticos 24h</h3>
              </div>
              <button
                onClick={fetchReminders}
                className="text-xs text-sky-600 hover:text-sky-800 p-1 rounded"
                title="Actualizar lista"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Detecta turnos confirmados para las próximas 24 a 36 horas que aún no han recibido recordatorio de WhatsApp.
            </p>

            {reminders.length === 0 ? (
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-emerald-900">Sin recordatorios pendientes</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Todos los pacientes próximos ya fueron notificados o no hay turnos en ventana.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-52 overflow-y-auto space-y-2">
                  {reminders.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900">{r.patientName}</strong>
                        <span className="text-[10px] font-mono text-amber-800">{r.phone}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {r.doctorName} • {r.scheduledFor}
                      </p>
                      <p className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded border border-amber-100">
                        "{r.messageTemplate}"
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSimulateDispatchReminders}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Despachar Recordatorios ({reminders.length} pendientes)
                </button>
              </div>
            )}

            {dispatchStatus && (
              <p className="text-[11px] text-emerald-700 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {dispatchStatus}
              </p>
            )}
          </div>

          {/* Card: Documentación de Webhooks REST */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Code2 className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Endpoints Integrados para n8n</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">GET</span>
                  <code className="text-xs font-mono text-slate-800 font-bold">/api/bot/check-availability</code>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Consulta franjas libres filtradas por especialidad, médico y fecha.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">POST</span>
                  <code className="text-xs font-mono text-slate-800 font-bold">/api/bot/book-appointment</code>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Crea o vincula al paciente y reserva el turno con validación de choques.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">POST</span>
                  <code className="text-xs font-mono text-slate-800 font-bold">/api/bot/cancel-appointment</code>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Cancela el turno próximo por DNI o ID y libera el consultorio.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">GET/POST</span>
                  <code className="text-xs font-mono text-slate-800 font-bold">/api/bot/reminders</code>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Devuelve y marca turnos para recordatorio 24 horas antes vía Cron n8n.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
