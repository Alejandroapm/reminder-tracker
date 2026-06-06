import {
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Droplets,
  Home,
  ListChecks,
  Moon,
  Plus,
  Search,
  Sparkles,
  TimerReset,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Frequency = "hourly" | "daily" | "weekly" | "monthly" | "specific";
type Priority = "low" | "normal" | "high";

type Reminder = {
  id: string;
  title: string;
  notes: string;
  frequency: Frequency;
  time: string;
  specificDate: string;
  daysOfWeek: number[];
  monthlyDay: number;
  intervalHours: number;
  snoozeMinutes: number;
  priority: Priority;
  category: string;
  nextDueAt: string;
  createdAt: string;
  completedCount: number;
  lastCompletedAt?: string;
  lastSnoozedAt?: string;
  enabled: boolean;
};

type ReminderDraft = Omit<
  Reminder,
  "id" | "createdAt" | "nextDueAt" | "completedCount" | "lastCompletedAt" | "lastSnoozedAt" | "enabled"
>;

const STORAGE_KEY = "reminder-tracker.reminders";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const frequencyLabels: Record<Frequency, string> = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  specific: "Date",
};

const categoryIcons: Record<string, typeof Droplets> = {
  Health: Droplets,
  Work: ListChecks,
  Home: Home,
  Personal: Sparkles,
  Evening: Moon,
};

const nowDate = new Date();
const pad = (value: number) => String(value).padStart(2, "0");
const todayDateInput = `${nowDate.getFullYear()}-${pad(nowDate.getMonth() + 1)}-${pad(nowDate.getDate())}`;

function roundedTimeInput(date: Date) {
  const rounded = new Date(date);
  rounded.setMinutes(Math.ceil(date.getMinutes() / 5) * 5, 0, 0);
  return `${pad(rounded.getHours())}:${pad(rounded.getMinutes())}`;
}

const currentTimeInput = roundedTimeInput(nowDate);

const defaultDraft: ReminderDraft = {
  title: "",
  notes: "",
  frequency: "daily",
  time: currentTimeInput,
  specificDate: todayDateInput,
  daysOfWeek: [1, 2, 3, 4, 5],
  monthlyDay: nowDate.getDate(),
  intervalHours: 1,
  snoozeMinutes: 10,
  priority: "normal",
  category: "Personal",
};

const presets: Array<Pick<ReminderDraft, "title" | "frequency" | "intervalHours" | "snoozeMinutes" | "category" | "notes">> = [
  {
    title: "Drink water",
    frequency: "hourly",
    intervalHours: 1,
    snoozeMinutes: 10,
    category: "Health",
    notes: "A quick glass now beats catching up later.",
  },
  {
    title: "Review priorities",
    frequency: "daily",
    intervalHours: 1,
    snoozeMinutes: 15,
    category: "Work",
    notes: "Pick the next small win.",
  },
  {
    title: "Reset for tomorrow",
    frequency: "daily",
    intervalHours: 1,
    snoozeMinutes: 20,
    category: "Evening",
    notes: "Clear the mental countertop.",
  },
];

function dateAtTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(date);
  value.setHours(hours || 0, minutes || 0, 0, 0);
  return value;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function nextMonthlyDate(from: Date, day: number, time: string) {
  for (let offset = 0; offset < 24; offset += 1) {
    const candidateMonth = new Date(from.getFullYear(), from.getMonth() + offset, 1);
    const safeDay = Math.min(day, daysInMonth(candidateMonth.getFullYear(), candidateMonth.getMonth()));
    const candidate = dateAtTime(
      new Date(candidateMonth.getFullYear(), candidateMonth.getMonth(), safeDay),
      time,
    );
    if (candidate > from) return candidate;
  }

  return new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
}

function nextWeeklyDate(from: Date, days: number[], time: string) {
  const selectedDays = days.length ? days : [from.getDay()];
  for (let offset = 0; offset < 14; offset += 1) {
    const candidateDay = new Date(from);
    candidateDay.setDate(from.getDate() + offset);
    if (!selectedDays.includes(candidateDay.getDay())) continue;

    const candidate = dateAtTime(candidateDay, time);
    if (candidate > from) return candidate;
  }

  return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
}

function getNextDue(draft: ReminderDraft | Reminder, from = new Date()) {
  if (draft.frequency === "specific") {
    return dateAtTime(new Date(`${draft.specificDate}T00:00:00`), draft.time);
  }

  if (draft.frequency === "hourly") {
    return new Date(from.getTime() + Math.max(1, draft.intervalHours) * 60 * 60 * 1000);
  }

  if (draft.frequency === "weekly") {
    return nextWeeklyDate(from, draft.daysOfWeek, draft.time);
  }

  if (draft.frequency === "monthly") {
    return nextMonthlyDate(from, Math.max(1, draft.monthlyDay), draft.time);
  }

  const today = dateAtTime(from, draft.time);
  if (today > from) return today;

  const tomorrow = new Date(from);
  tomorrow.setDate(from.getDate() + 1);
  return dateAtTime(tomorrow, draft.time);
}

function formatDue(value: string) {
  const due = new Date(value);
  const now = new Date();
  const sameDay = due.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const time = due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today at ${time}`;
  if (due.toDateString() === tomorrow.toDateString()) return `Tomorrow at ${time}`;
  return due.toLocaleDateString([], { month: "short", day: "numeric" }) + ` at ${time}`;
}

function recurrenceSummary(reminder: Reminder | ReminderDraft) {
  if (reminder.frequency === "hourly") {
    return reminder.intervalHours === 1 ? "Every hour" : `Every ${reminder.intervalHours} hours`;
  }

  if (reminder.frequency === "weekly") {
    return `Weekly on ${reminder.daysOfWeek.map((day) => dayLabels[day]).join(", ")}`;
  }

  if (reminder.frequency === "monthly") {
    return `Monthly on day ${reminder.monthlyDay}`;
  }

  if (reminder.frequency === "specific") {
    return "One-time reminder";
  }

  return "Every day";
}

function priorityTone(priority: Priority) {
  if (priority === "high") return "priorityHigh";
  if (priority === "low") return "priorityLow";
  return "priorityNormal";
}

function loadReminders() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Reminder[];
  } catch {
    return [];
  }
}

function makeReminder(draft: ReminderDraft): Reminder {
  return {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    nextDueAt: getNextDue(draft).toISOString(),
    completedCount: 0,
    enabled: true,
  };
}

function sendBrowserNotification(reminder: Reminder) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const body = `${recurrenceSummary(reminder)} · ${formatDue(reminder.nextDueAt)}`;
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_REMINDER",
      reminder: { id: reminder.id, title: reminder.title, body },
    });
    return;
  }

  new Notification(reminder.title, {
    body,
    icon: `${import.meta.env.BASE_URL}icons/icon.svg`,
    tag: reminder.id,
  });
}

export function App() {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [draft, setDraft] = useState<ReminderDraft>(defaultDraft);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "snoozed" | "done">("all");
  const [dueId, setDueId] = useState<string | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    const checkDue = () => {
      const now = Date.now();
      const due = reminders.find((reminder) => reminder.enabled && new Date(reminder.nextDueAt).getTime() <= now);
      if (!due) return;

      setDueId((current) => current ?? due.id);
      const notificationKey = `${due.id}:${due.nextDueAt}`;
      if (!notifiedRef.current.has(notificationKey)) {
        notifiedRef.current.add(notificationKey);
        sendBrowserNotification(due);
      }
    };

    checkDue();
    const interval = window.setInterval(checkDue, 15_000);
    return () => window.clearInterval(interval);
  }, [reminders]);

  const dueReminder = reminders.find((reminder) => reminder.id === dueId) ?? null;

  const stats = useMemo(() => {
    const now = new Date();
    return {
      active: reminders.filter((reminder) => reminder.enabled).length,
      dueToday: reminders.filter(
        (reminder) => reminder.enabled && new Date(reminder.nextDueAt).toDateString() === now.toDateString(),
      ).length,
      completed: reminders.reduce((total, reminder) => total + reminder.completedCount, 0),
    };
  }, [reminders]);

  const visibleReminders = useMemo(() => {
    const search = query.trim().toLowerCase();
    const now = new Date();

    return reminders
      .filter((reminder) => {
        if (
          filter === "today" &&
          (!reminder.enabled || new Date(reminder.nextDueAt).toDateString() !== now.toDateString())
        ) {
          return false;
        }
        if (filter === "snoozed" && !reminder.lastSnoozedAt) return false;
        if (filter === "done" && reminder.completedCount === 0) return false;
        if (!search) return true;
        return `${reminder.title} ${reminder.notes} ${reminder.category}`.toLowerCase().includes(search);
      })
      .sort((left, right) => new Date(left.nextDueAt).getTime() - new Date(right.nextDueAt).getTime());
  }, [filter, query, reminders]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
  };

  const addReminder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) return;

    setReminders((current) => [makeReminder({ ...draft, title: draft.title.trim() }), ...current]);
    setDraft(defaultDraft);
    setComposerOpen(false);
  };

  const completeReminder = (id: string) => {
    setReminders((current) =>
      current.map((reminder) => {
        if (reminder.id !== id) return reminder;

        const completedAt = new Date().toISOString();
        if (reminder.frequency === "specific") {
          return {
            ...reminder,
            enabled: false,
            completedCount: reminder.completedCount + 1,
            lastCompletedAt: completedAt,
          };
        }

        return {
          ...reminder,
          nextDueAt: getNextDue(reminder, new Date()).toISOString(),
          completedCount: reminder.completedCount + 1,
          lastCompletedAt: completedAt,
          lastSnoozedAt: undefined,
        };
      }),
    );
    setDueId(null);
  };

  const snoozeReminder = (id: string) => {
    setReminders((current) =>
      current.map((reminder) => {
        if (reminder.id !== id) return reminder;
        return {
          ...reminder,
          nextDueAt: new Date(Date.now() + reminder.snoozeMinutes * 60 * 1000).toISOString(),
          lastSnoozedAt: new Date().toISOString(),
        };
      }),
    );
    setDueId(null);
  };

  const removeReminder = (id: string) => {
    setReminders((current) => current.filter((reminder) => reminder.id !== id));
    if (dueId === id) setDueId(null);
  };

  const applyPreset = (preset: (typeof presets)[number]) => {
    setDraft((current) => ({
      ...current,
      ...preset,
      title: preset.title,
      time: currentTimeInput,
      specificDate: todayDateInput,
    }));
    setComposerOpen(true);
  };

  return (
    <main className="appShell">
      <section className="phoneSurface" aria-label="Reminder Tracker app">
        <header className="topBar">
          <div>
            <p className="eyebrow">Reminder Tracker</p>
            <h1>Keep the day moving.</h1>
          </div>
          <button className="iconButton" onClick={requestNotifications} aria-label="Enable notifications" title="Enable notifications">
            <Bell size={21} />
          </button>
        </header>

        <section className="statusBand" aria-label="Reminder summary">
          <div>
            <strong>{stats.active}</strong>
            <span>Active</span>
          </div>
          <div>
            <strong>{stats.dueToday}</strong>
            <span>Today</span>
          </div>
          <div>
            <strong>{stats.completed}</strong>
            <span>Done</span>
          </div>
        </section>

        <section className="quickRow" aria-label="Quick reminder presets">
          {presets.map((preset) => (
            <button key={preset.title} className="presetButton" onClick={() => applyPreset(preset)}>
              <span>{preset.title}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </section>

        <div className="toolbar">
          <label className="searchBox">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search reminders"
            />
          </label>
          <button className="addButton" onClick={() => setComposerOpen(true)}>
            <Plus size={20} />
            <span>New</span>
          </button>
        </div>

        <nav className="filters" aria-label="Reminder filters">
          {(["all", "today", "snoozed", "done"] as const).map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </nav>

        <section className="reminderList" aria-live="polite">
          {visibleReminders.length === 0 ? (
            <div className="emptyState">
              <CalendarClock size={42} />
              <h2>No reminders here</h2>
              <p>Add one or try a quick preset.</p>
            </div>
          ) : (
            visibleReminders.map((reminder) => {
              const Icon = categoryIcons[reminder.category] ?? Sparkles;
              const isDue = new Date(reminder.nextDueAt).getTime() <= Date.now() && reminder.enabled;
              return (
                <article className={`reminderCard ${isDue ? "due" : ""} ${reminder.enabled ? "" : "completed"}`} key={reminder.id}>
                  <button
                    className="completeButton"
                    onClick={() => completeReminder(reminder.id)}
                    aria-label={reminder.enabled ? `Complete ${reminder.title}` : `Completed ${reminder.title}`}
                    disabled={!reminder.enabled}
                  >
                    {reminder.enabled ? <Circle size={22} /> : <Check size={22} />}
                  </button>
                  <div className="reminderBody">
                    <div className="cardTop">
                      <div className="categoryPill">
                        <Icon size={14} />
                        {reminder.category}
                      </div>
                      <span className={`priorityDot ${priorityTone(reminder.priority)}`} />
                    </div>
                    <h2>{reminder.title}</h2>
                    {reminder.notes ? <p>{reminder.notes}</p> : null}
                    <div className="metaGrid">
                      <span>
                        <Clock3 size={15} />
                        {formatDue(reminder.nextDueAt)}
                      </span>
                      <span>
                        <TimerReset size={15} />
                        {recurrenceSummary(reminder)}
                      </span>
                    </div>
                  </div>
                  <button className="deleteButton" onClick={() => removeReminder(reminder.id)} aria-label={`Delete ${reminder.title}`}>
                    <Trash2 size={18} />
                  </button>
                </article>
              );
            })
          )}
        </section>
      </section>

      {isComposerOpen ? (
        <div className="sheetBackdrop" role="presentation">
          <form className="composerSheet" onSubmit={addReminder}>
            <div className="sheetHeader">
              <div>
                <p className="eyebrow">New Reminder</p>
                <h2>Set the rhythm</h2>
              </div>
              <button type="button" className="iconButton ghost" onClick={() => setComposerOpen(false)} aria-label="Close">
                <X size={21} />
              </button>
            </div>

            <label className="field wide">
              <span>Title</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="Drink water"
                required
              />
            </label>

            <label className="field wide">
              <span>Notes</span>
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                placeholder="Optional details"
                rows={3}
              />
            </label>

            <div className="fieldGroup">
              <label className="field">
                <span>Frequency</span>
                <select
                  value={draft.frequency}
                  onChange={(event) => setDraft({ ...draft, frequency: event.target.value as Frequency })}
                >
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Snooze</span>
                <select
                  value={draft.snoozeMinutes}
                  onChange={(event) => setDraft({ ...draft, snoozeMinutes: Number(event.target.value) })}
                >
                  {[5, 10, 15, 20, 30, 60].map((minutes) => (
                    <option value={minutes} key={minutes}>
                      {minutes} min
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {draft.frequency === "hourly" ? (
              <label className="field wide">
                <span>Every</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={draft.intervalHours}
                  onChange={(event) => setDraft({ ...draft, intervalHours: Number(event.target.value) })}
                />
              </label>
            ) : null}

            {draft.frequency !== "hourly" ? (
              <label className="field wide">
                <span>Time</span>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) => setDraft({ ...draft, time: event.target.value })}
                />
              </label>
            ) : null}

            {draft.frequency === "specific" ? (
              <label className="field wide">
                <span>Date</span>
                <input
                  type="date"
                  value={draft.specificDate}
                  onChange={(event) => setDraft({ ...draft, specificDate: event.target.value })}
                />
              </label>
            ) : null}

            {draft.frequency === "weekly" ? (
              <div className="dayPicker" aria-label="Weekly days">
                {dayLabels.map((label, index) => (
                  <button
                    type="button"
                    className={draft.daysOfWeek.includes(index) ? "selected" : ""}
                    key={label}
                    onClick={() => {
                      const nextDays = draft.daysOfWeek.includes(index)
                        ? draft.daysOfWeek.filter((day) => day !== index)
                        : [...draft.daysOfWeek, index].sort();
                      setDraft({ ...draft, daysOfWeek: nextDays });
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            {draft.frequency === "monthly" ? (
              <label className="field wide">
                <span>Day of month</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={draft.monthlyDay}
                  onChange={(event) => setDraft({ ...draft, monthlyDay: Number(event.target.value) })}
                />
              </label>
            ) : null}

            <div className="fieldGroup">
              <label className="field">
                <span>Priority</span>
                <select
                  value={draft.priority}
                  onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="field">
                <span>List</span>
                <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
                  {Object.keys(categoryIcons).map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="primaryAction" type="submit">
              <Plus size={20} />
              Create reminder
            </button>
          </form>
        </div>
      ) : null}

      {dueReminder ? (
        <div className="alertBackdrop" role="dialog" aria-modal="true" aria-labelledby="due-title">
          <section className="dueDialog">
            <div className="pulseIcon">
              <Bell size={30} />
            </div>
            <p className="eyebrow">Reminder due</p>
            <h2 id="due-title">{dueReminder.title}</h2>
            <p>{dueReminder.notes || recurrenceSummary(dueReminder)}</p>
            <div className="dialogActions">
              <button onClick={() => completeReminder(dueReminder.id)} className="completeAction">
                <Check size={22} />
                Complete
              </button>
              <button onClick={() => snoozeReminder(dueReminder.id)} className="snoozeAction">
                <TimerReset size={22} />
                Snooze {dueReminder.snoozeMinutes}m
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
