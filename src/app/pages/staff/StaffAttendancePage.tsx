import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Calendar, Inbox, ClipboardList } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { StaffAttendance } from './StaffAttendance';
import { StaffAttendanceRequests } from './StaffAttendanceRequests';
import { StaffMyAttendanceList } from './StaffMyAttendanceList';

type TabId = 'schedule' | 'requests' | 'list';

export function StaffAttendancePage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<TabId>(() => (tabParam === 'requests' ? 'requests' : tabParam === 'list' ? 'list' : 'schedule'));

  useEffect(() => {
    const p = searchParams.get('tab');
    setTab(p === 'requests' ? 'requests' : p === 'list' ? 'list' : 'schedule');
  }, [searchParams]);

  const setTabAndUrl = (id: TabId) => {
    setTab(id);
    setSearchParams(id === 'schedule' ? {} : { tab: id }, { replace: true });
  };

  const tabs: { id: TabId; labelKey: string; icon: typeof Calendar }[] = [
    { id: 'schedule', labelKey: 'staff.scheduleAndAttendance', icon: Calendar },
    { id: 'requests', labelKey: 'common.attendanceRequests', icon: Inbox },
    { id: 'list', labelKey: 'staff.myAttendance', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        {tabs.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTabAndUrl(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === id
                ? 'text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            style={tab === id ? { background: 'var(--btc-primary,#2E8B57)' } : {}}
          >
            <Icon size={18} />
            {t(labelKey)}
          </button>
        ))}
      </div>
      {tab === 'schedule' && <StaffAttendance />}
      {tab === 'requests' && <StaffAttendanceRequests />}
      {tab === 'list' && <StaffMyAttendanceList />}
    </div>
  );
}
