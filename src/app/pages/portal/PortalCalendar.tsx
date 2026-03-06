import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Video, ChevronLeft, ChevronRight } from 'lucide-react';

const events: any[] = [];

const TYPE_BADGES: Record<string, string> = {
  class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  virtual: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deadline: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  exam: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  event: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function PortalCalendar() {
  const [selectedDate, setSelectedDate] = useState('2026-03-05');

  const march2026 = [];
  for (let i = 0; i < 31; i++) {
    const d = new Date(2026, 2, i + 1);
    march2026.push({ date: d, day: i + 1, dow: d.getDay() });
  }
  const startPad = (march2026[0].dow + 6) % 7;

  const dayEvents = events.filter(e => e.date === selectedDate);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Calendar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your schedule and upcoming events</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 dark:text-white font-semibold" style={{ fontFamily: 'Poppins' }}>March 2026</h3>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronLeft size={16} /></button>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(startPad)].map((_, i) => <div key={`pad-${i}`} />)}
            {march2026.map(d => {
              const dateStr = `2026-03-${String(d.day).padStart(2, '0')}`;
              const hasEvents = events.some(e => e.date === dateStr);
              const isSelected = dateStr === selectedDate;
              const isToday = d.day === 5;
              return (
                <button key={d.day} onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                    isSelected ? 'text-white shadow-lg' : isToday ? 'bg-green-50 dark:bg-green-900/20 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  style={isSelected ? { background: 'var(--btc-primary,#16a34a)' } : {}}>
                  {d.day}
                  {hasEvents && !isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--btc-primary,#16a34a)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events for selected date */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-gray-900 dark:text-white font-semibold mb-1" style={{ fontFamily: 'Poppins' }}>
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</p>

          {dayEvents.length > 0 ? (
            <div className="space-y-3">
              {dayEvents.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl border-l-4 bg-gray-50 dark:bg-gray-700/50"
                  style={{ borderLeftColor: e.color }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={11} /> {e.time}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_BADGES[e.type]}`}>{e.type}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{e.title}</p>
                  {e.location && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      {e.type === 'virtual' ? <Video size={11} /> : <MapPin size={11} />} {e.location}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No events for this day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}