import { Search, Bell, UserCircle, Lock, LogOut, Users, CalendarDays, Wallet, Database, BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffService } from "@/services/staff";
import { reminderService } from "@/services/reminders";
import { useAuthContext } from "@/stores/authContext";
import type { Reminder } from "@/types/reminders";
import type { Employee } from "@/types/staff";

interface HeaderProps {
  username: string | null;
  onLock: () => void;
  onLogout: () => void;
}

export function Header({ username, onLock, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const auth = useAuthContext();
  const token = auth.token;
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Reminder[]>([]);
  const [notificationBusy, setNotificationBusy] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void staffService.getEmployees().then((items) => { if (active) setEmployees(items); }).catch(() => { if (active) setEmployees([]); });
    return () => { active = false; };
  }, []);

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const due = await reminderService.unreadDue(token);
      setNotifications(Array.isArray(due) ? due.filter(Boolean).slice(0, 8) : []);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => { void loadNotifications(); const timer = window.setInterval(() => void loadNotifications(), 30000); return () => window.clearInterval(timer); }, [token]);

  const openNotification = async (reminder: Reminder) => {
    if (!token || notificationBusy === reminder.id) return;
    setNotificationBusy(reminder.id);
    try {
      await reminderService.markRead(token, reminder.id);
      setNotifications((current) => current.filter((item) => item.id !== reminder.id));
      setNotificationsOpen(true);
      navigate(`/reminders?reminder=${reminder.id}`);
    } finally {
      setNotificationBusy(null);
    }
  };

  const pages = useMemo(() => [
    { label: "Dashboard", path: "/", icon: BarChart3, keywords: "home dashboard overview" },
    { label: "Basic Data", path: "/basic-data", icon: Database, keywords: "company departments positions payroll configuration" },
    { label: "Staff Records", path: "/staff", icon: Users, keywords: "employees staff worker records" },
    { label: "Leaves", path: "/leaves", icon: CalendarDays, keywords: "leave vacation balance history" },
    { label: "Payments / Payroll", path: "/payroll", icon: Wallet, keywords: "pay payroll salary payslip" },
  ], []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { pages: pages.slice(0, 4), employees: [] as Employee[] };
    const pageMatches = pages.filter((p) => `${p.label} ${p.keywords}`.toLowerCase().includes(q));
    const employeeMatches = employees.filter((e) => `${e.employee_code} ${e.first_name} ${e.last_name} ${e.phone ?? ""} ${e.email ?? ""}`.toLowerCase().includes(q)).slice(0, 6);
    return { pages: pageMatches.slice(0, 5), employees: employeeMatches };
  }, [employees, pages, query]);

  const choosePage = (path: string) => { setQuery(""); setOpen(false); navigate(path); };
  const chooseEmployee = (employee: Employee) => {
    setQuery("");
    setOpen(false);
    // Pass both route state and a URL parameter so the result opens reliably
    // even when the Staff page is already mounted.
    const nonce = Date.now().toString();
    navigate(`/staff?employee=${encodeURIComponent(employee.id)}&searchNonce=${nonce}`, {
      state: { employeeId: employee.id, searchNonce: nonce },
    });
  };

  return (
    <header className="relative flex h-[76px] shrink-0 items-center justify-between border-b border-[#292929] bg-[#111111]/95 px-5 backdrop-blur lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative w-full max-w-[420px]">
          <div className="flex h-10 items-center gap-2.5 rounded-xl border border-[#2a2a2a] bg-[#171717] px-3.5 transition-all duration-200 focus-within:border-[#4a8b3f]/60 focus-within:bg-[#1a1a1a]">
            <Search className="h-4 w-4 shrink-0 text-[#6f6f6f]" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); setQuery(""); } }}
              type="text"
              placeholder="Search pages, employees, codes..."
              className="w-full bg-transparent text-[13px] text-white placeholder:text-[#666666] focus:outline-none"
              aria-label="Global search"
            />
          </div>
          {open && (query.trim() || matches.employees.length || matches.pages.length) && (
            <div className="absolute left-0 right-0 top-[48px] z-[70] overflow-hidden rounded-2xl border border-[#2d2d2d] bg-[#141414] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] animate-[slide-up_.18s_ease-out]">
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d6d6d]">Quick search</p>
              {matches.pages.map((item) => { const Icon = item.icon; return <button key={item.path} type="button" onClick={() => choosePage(item.path)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#dddddd] transition hover:bg-[#1d1d1d] hover:text-white"><Icon className="h-4 w-4 text-[#68a85f]" /><span>{item.label}</span><span className="ml-auto text-[10px] text-[#666]">Page</span></button>; })}
              {matches.employees.length > 0 && <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d6d6d]">Employees</p>}
              {matches.employees.map((employee) => <button key={employee.id} type="button" onClick={() => chooseEmployee(employee)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#1d1d1d]"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#4a8b3f]/12 text-[#6aac60]"><Users className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{employee.first_name} {employee.last_name}</p><p className="text-[10px] text-[#737373]">{employee.employee_code}</p></div></button>)}
              {query.trim() && matches.pages.length === 0 && matches.employees.length === 0 && <p className="px-3 py-4 text-center text-sm text-[#777]">No matching pages or employees.</p>}
            </div>
          )}
        </div>
      </div>

      <div className="ml-4 flex items-center gap-1.5">
        <div className="relative">
          <button type="button" onClick={() => setNotificationsOpen((value) => !value)} title="Notifications" className="relative rounded-xl p-2.5 text-[#7d7d7d] transition-all duration-200 hover:bg-[#1d1d1d] hover:text-[#67ab5a]">
            <Bell className="h-[18px] w-[18px]" />
            {notifications.length > 0 && <span className="absolute right-1 top-1 grid min-h-[15px] min-w-[15px] place-items-center rounded-full bg-[#4a8b3f] px-1 text-[8px] font-bold text-white ring-2 ring-[#111111]">{notifications.length > 9 ? "9+" : notifications.length}</span>}
          </button>
          {notificationsOpen && <div className="absolute right-0 top-[48px] z-[80] w-[340px] overflow-hidden rounded-2xl border border-[#2d2d2d] bg-[#141414] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-[#292929] px-4 py-3"><div><p className="text-sm font-semibold text-white">Notifications</p><p className="text-[10px] text-[#6f6f6f]">Due reminders</p></div><span className="rounded-full bg-[#4a8b3f]/15 px-2 py-1 text-[10px] font-semibold text-[#79b672]">{notifications.length} unread</span></div>
            {notifications.length === 0 ? <div className="px-4 py-8 text-center text-xs text-[#777]">No unread reminders.</div> : <div className="max-h-[360px] overflow-auto p-2">{notifications.map((item) => <button key={item.id} type="button" onClick={() => void openNotification(item)} className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#1d1d1d]"><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#4a8b3f]/12 text-[#6aac60]"><Bell className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-[12px] font-semibold text-white">{item.title}</p><p className="mt-0.5 line-clamp-2 text-[10px] text-[#8a8a8a]">{item.message || "Reminder is due."}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-[#5f5f5f]">{item.reminder_type}</p></div></button>)}</div>}
          </div>}
        </div>
        <button type="button" onClick={onLock} title="Lock session" className="rounded-xl p-2.5 text-[#7d7d7d] transition-all duration-200 hover:bg-[#1d1d1d] hover:text-[#67ab5a]"><Lock className="h-[18px] w-[18px]" /></button>
        <button type="button" onClick={onLogout} title="Sign out" className="rounded-xl p-2.5 text-[#7d7d7d] transition-all duration-200 hover:bg-[#1d1d1d] hover:text-[#67ab5a]"><LogOut className="h-[18px] w-[18px]" /></button>
        <div className="ml-2 flex items-center gap-2.5 border-l border-[#292929] pl-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f1f1f] ring-1 ring-[#2c2c2c]"><UserCircle className="h-5 w-5 text-[#8f8f8f]" /></div><div className="hidden sm:block"><p className="text-[12px] font-semibold text-white">{username || "Administrator"}</p><p className="mt-0.5 text-[10px] text-[#6f6f6f]">Local account</p></div></div>
      </div>
    </header>
  );
}
