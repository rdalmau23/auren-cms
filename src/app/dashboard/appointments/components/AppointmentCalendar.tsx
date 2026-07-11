'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTranslations } from 'next-intl';

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export interface AppointmentEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any; // Raw appointment data
}

interface AppointmentCalendarProps {
  events: AppointmentEvent[];
  onSelectEvent?: (event: AppointmentEvent) => void;
  isAdmin?: boolean;
}

export function AppointmentCalendar({ events, onSelectEvent, isAdmin }: AppointmentCalendarProps) {
  const t = useTranslations('appointments');
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const messages = useMemo(
    () => ({
      allDay: 'Todo el día',
      previous: 'Anterior',
      next: 'Siguiente',
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      agenda: 'Agenda',
      date: 'Fecha',
      time: 'Hora',
      event: 'Cita',
      noEventsInRange: 'No hay visitas en este rango de fechas.',
      showMore: (total: number) => `+ ${total} más`,
    }),
    []
  );

  // Custom Event Component for standard styling
  const CustomEvent = ({ event }: { event: AppointmentEvent }) => {
    const app = event.resource;
    const isPast = event.end < new Date();
    
    // Determine colors based on status and time
    let bgClass = "bg-blue-100 border-blue-200 text-blue-800";
    if (app.status === 'COMPLETED') bgClass = "bg-green-100 border-green-200 text-green-800";
    else if (app.status === 'CANCELLED' || app.status === 'NO_SHOW') bgClass = "bg-red-100 border-red-200 text-red-800";
    else if (isPast) bgClass = "bg-orange-100 border-orange-200 text-orange-800";

    return (
      <div 
        className={`h-full w-full rounded-md border p-1 flex flex-col justify-start overflow-hidden transition-all duration-200 hover:shadow-md group ${bgClass}`}
        title={`${app.patientName} - ${app.type}\n${app.notes ? app.notes : ''}`}
      >
        <div className="font-semibold text-xs leading-tight truncate">
          {app.patientName}
        </div>
        <div className="text-[10px] opacity-80 mt-0.5 flex flex-col">
           <span className="truncate">{app.type}</span>
           {isAdmin && <span className="truncate font-medium mt-0.5">{app.professionalName}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-white rounded-2xl border border-neutral-100 p-4 lg:p-6 flex flex-col shadow-sm">
      <div className="flex-1 min-h-[600px] rbc-custom-theme">
        <Calendar
          culture="es"
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          messages={messages}
          onSelectEvent={onSelectEvent}
          min={new Date(0, 0, 0, 7, 0, 0)} // Start at 7:00 AM
          max={new Date(0, 0, 0, 22, 0, 0)} // End at 10:00 PM
          components={{
            event: CustomEvent,
          }}
          eventPropGetter={() => ({
            style: {
              backgroundColor: 'transparent', // Reset to allow custom component styling
              border: 'none',
              padding: 0,
            }
          })}
        />
      </div>

      {/* Global overrides for react-big-calendar to make it look premium with Tailwind */}
      <style dangerouslySetInnerHTML={{__html: `
        .rbc-custom-theme .rbc-toolbar button {
          color: #52525b;
          border: 1px solid #e4e4e7;
          background: #ffffff;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .rbc-custom-theme .rbc-toolbar button:hover {
          background: #f4f4f5;
          color: #18181b;
        }
        .rbc-custom-theme .rbc-toolbar button.rbc-active {
          background: #f4f4f5;
          color: #18181b;
          box-shadow: none;
          border-color: #d4d4d8;
        }
        .rbc-custom-theme .rbc-toolbar .rbc-toolbar-label {
          font-weight: 700;
          font-size: 1.125rem;
          color: #18181b;
          text-transform: capitalize;
        }
        .rbc-custom-theme .rbc-header {
          padding: 8px 0;
          font-weight: 600;
          color: #52525b;
          text-transform: uppercase;
          font-size: 0.75rem;
          border-bottom: 1px solid #f4f4f5;
        }
        .rbc-custom-theme .rbc-today {
          background-color: #f8fafc;
        }
        .rbc-custom-theme .rbc-time-content,
        .rbc-custom-theme .rbc-month-view,
        .rbc-custom-theme .rbc-time-view,
        .rbc-custom-theme .rbc-time-header.rbc-overflowing {
          border-color: #f4f4f5;
          border-radius: 8px;
        }
        .rbc-custom-theme .rbc-day-bg + .rbc-day-bg,
        .rbc-custom-theme .rbc-month-row + .rbc-month-row,
        .rbc-custom-theme .rbc-time-header > .rbc-row:first-child,
        .rbc-custom-theme .rbc-time-header > .rbc-row.rbc-row-resource,
        .rbc-custom-theme .rbc-time-content > * + * > * {
          border-color: #f4f4f5;
        }
        .rbc-custom-theme .rbc-timeslot-group {
          border-color: #f4f4f5;
        }
        .rbc-custom-theme .rbc-time-gutter .rbc-timeslot-group {
          border-color: transparent;
        }
        .rbc-custom-theme .rbc-label {
          color: #a1a1aa;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .rbc-custom-theme .rbc-event {
          background-color: transparent;
        }
      `}} />
    </div>
  );
}
