import { Capacitor } from "@capacitor/core";
import { LocalNotifications, Weekday } from "@capacitor/local-notifications";
import {
  Bell,
  CalendarClock,
  Check,
  Circle,
  Clock3,
  Droplets,
  Edit3,
  Heart,
  Home,
  Languages,
  ListChecks,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Smartphone,
  Sparkles,
  TimerReset,
  Trash2,
  User,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Frequency = "hourly" | "daily" | "weekly" | "monthly" | "specific";
type Priority = "low" | "normal" | "high";
type Language = "en" | "es";

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

type AppSettings = {
  username: string;
  language: Language;
};

const STORAGE_KEY = "reminder-tracker.reminders";
const SETTINGS_KEY = "reminder-tracker.settings";
const NATIVE_ACTION_TYPE = "REMINDER_ACTIONS";

const copy = {
  en: {
    appName: "Reminder Tracker",
    hello: "Hello",
    setNameTitle: "Set up your app",
    setNameBody: "Choose the name this app should greet you with.",
    getStarted: "Get started",
    username: "Username",
    usernamePlaceholder: "Alex",
    settings: "Settings",
    language: "Language",
    english: "English",
    spanish: "Spanish",
    notifications: "Notifications",
    enableNotifications: "Enable notifications",
    notificationsOn: "Notifications enabled",
    nativeNotifications: "Native scheduled notifications",
    webNotifications: "Web notifications while the app is open",
    nativeNote: "Build with Capacitor for real iPhone local notifications.",
    soundLimitNote: "Silent-mode override requires Apple's Critical Alerts entitlement.",
    active: "Active",
    today: "Today",
    done: "Done",
    search: "Search",
    new: "New",
    filters: {
      all: "All",
      today: "Today",
      snoozed: "Snoozed",
      done: "Done",
    },
    noReminders: "No reminders here",
    noRemindersHelp: "Create a reminder to start tracking.",
    newReminder: "New Reminder",
    setRhythm: "Set the rhythm",
    title: "Title",
    notes: "Notes",
    optionalDetails: "Optional details",
    titlePlaceholder: "Take medicine",
    frequency: "Frequency",
    snooze: "Snooze",
    every: "Every",
    time: "Time",
    date: "Date",
    dayOfMonth: "Day of month",
    priority: "Priority",
    list: "List",
    createReminder: "Create reminder",
    reminderDue: "Reminder due",
    complete: "Complete",
    edit: "Edit",
    saveChanges: "Save changes",
    status: "Status",
    activeStatus: "Active",
    completedStatus: "Completed",
    delete: "Delete",
    minute: "min",
    hourInterval: "hours",
    frequencyLabel: {
      hourly: "Hourly",
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      specific: "Date",
    },
    priorityLabel: {
      low: "Low",
      normal: "Normal",
      high: "High",
    },
    categories: {
      Health: "Health",
      Work: "Work",
      Home: "Home",
      Personal: "Personal",
      Evening: "Evening",
    },
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    todayAt: "Today at",
    tomorrowAt: "Tomorrow at",
    everyHour: "Every hour",
    everyHours: "Every {count} hours",
    weeklyOn: "Weekly on {days}",
    monthlyOn: "Monthly on day {day}",
    oneTime: "One-time reminder",
    daily: "Every day",
  },
  es: {
    appName: "Recordatorios",
    hello: "Hola",
    setNameTitle: "Configura tu app",
    setNameBody: "Elige el nombre con el que la app debe saludarte.",
    getStarted: "Empezar",
    username: "Usuario",
    usernamePlaceholder: "Alex",
    settings: "Configuracion",
    language: "Idioma",
    english: "Ingles",
    spanish: "Espanol",
    notifications: "Notificaciones",
    enableNotifications: "Activar notificaciones",
    notificationsOn: "Notificaciones activadas",
    nativeNotifications: "Notificaciones nativas programadas",
    webNotifications: "Notificaciones web con la app abierta",
    nativeNote: "Compila con Capacitor para notificaciones locales reales en iPhone.",
    soundLimitNote: "Ignorar modo silencio requiere el permiso Critical Alerts de Apple.",
    active: "Activos",
    today: "Hoy",
    done: "Hechos",
    search: "Buscar",
    new: "Nuevo",
    filters: {
      all: "Todos",
      today: "Hoy",
      snoozed: "Pospuestos",
      done: "Hechos",
    },
    noReminders: "No hay recordatorios",
    noRemindersHelp: "Crea un recordatorio para empezar.",
    newReminder: "Nuevo recordatorio",
    setRhythm: "Define el ritmo",
    title: "Titulo",
    notes: "Notas",
    optionalDetails: "Detalles opcionales",
    titlePlaceholder: "Tomar medicina",
    frequency: "Frecuencia",
    snooze: "Posponer",
    every: "Cada",
    time: "Hora",
    date: "Fecha",
    dayOfMonth: "Dia del mes",
    priority: "Prioridad",
    list: "Lista",
    createReminder: "Crear recordatorio",
    reminderDue: "Recordatorio pendiente",
    complete: "Completar",
    edit: "Editar",
    saveChanges: "Guardar cambios",
    status: "Estado",
    activeStatus: "Activo",
    completedStatus: "Completado",
    delete: "Eliminar",
    minute: "min",
    hourInterval: "horas",
    frequencyLabel: {
      hourly: "Cada hora",
      daily: "Diario",
      weekly: "Semanal",
      monthly: "Mensual",
      specific: "Fecha",
    },
    priorityLabel: {
      low: "Baja",
      normal: "Normal",
      high: "Alta",
    },
    categories: {
      Health: "Salud",
      Work: "Trabajo",
      Home: "Casa",
      Personal: "Personal",
      Evening: "Noche",
    },
    days: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
    todayAt: "Hoy a las",
    tomorrowAt: "Manana a las",
    everyHour: "Cada hora",
    everyHours: "Cada {count} horas",
    weeklyOn: "Semanal: {days}",
    monthlyOn: "Mensual el dia {day}",
    oneTime: "Recordatorio unico",
    daily: "Cada dia",
  },
} satisfies Record<Language, Record<string, unknown>>;

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

function defaultLanguage(): Language {
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { username: "", language: defaultLanguage() };

    const parsed = JSON.parse(stored) as Partial<AppSettings>;
    return {
      username: parsed.username ?? "",
      language: parsed.language === "es" ? "es" : "en",
    };
  } catch {
    return { username: "", language: defaultLanguage() };
  }
}

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

function formatDue(value: string, language: Language) {
  const due = new Date(value);
  const now = new Date();
  const sameDay = due.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const locale = language === "es" ? "es" : undefined;
  const time = due.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  const labels = copy[language];

  if (sameDay) return `${labels.todayAt} ${time}`;
  if (due.toDateString() === tomorrow.toDateString()) return `${labels.tomorrowAt} ${time}`;

  return due.toLocaleDateString(locale, { month: "short", day: "numeric" }) + ` ${time}`;
}

function recurrenceSummary(reminder: Reminder | ReminderDraft, language: Language) {
  const labels = copy[language];
  if (reminder.frequency === "hourly") {
    return reminder.intervalHours === 1
      ? labels.everyHour
      : labels.everyHours.replace("{count}", String(reminder.intervalHours));
  }

  if (reminder.frequency === "weekly") {
    const days = reminder.daysOfWeek.map((day) => labels.days[day]).join(", ");
    return labels.weeklyOn.replace("{days}", days);
  }

  if (reminder.frequency === "monthly") {
    return labels.monthlyOn.replace("{day}", String(reminder.monthlyDay));
  }

  if (reminder.frequency === "specific") {
    return labels.oneTime;
  }

  return labels.daily;
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

function notificationIdFor(reminderId: string) {
  let hash = 0;
  for (let index = 0; index < reminderId.length; index += 1) {
    hash = (hash * 31 + reminderId.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) || 1;
}

const nativeWeekdays = [
  Weekday.Sunday,
  Weekday.Monday,
  Weekday.Tuesday,
  Weekday.Wednesday,
  Weekday.Thursday,
  Weekday.Friday,
  Weekday.Saturday,
];

function isNativeNotificationsAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("LocalNotifications");
}

async function ensureNativeNotificationPermission() {
  if (!isNativeNotificationsAvailable()) return false;

  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") return true;

  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

async function registerNativeActions(language: Language) {
  if (!isNativeNotificationsAvailable()) return;

  const labels = copy[language];
  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: NATIVE_ACTION_TYPE,
        actions: [
          { id: "complete", title: labels.complete, foreground: true },
          { id: "snooze", title: labels.snooze, foreground: true },
        ],
      },
    ],
  });
}

async function syncNativeNotifications(reminders: Reminder[], language: Language) {
  if (!isNativeNotificationsAvailable()) return;
  const permitted = await ensureNativeNotificationPermission();
  if (!permitted) return;

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((notification) => ({ id: notification.id })),
    });
  }

  const labels = copy[language];
  const now = Date.now();
  const notifications = reminders
    .filter((reminder) => reminder.enabled)
    .flatMap((reminder) => {
      const due = new Date(reminder.nextDueAt);
      const at = due.getTime() <= now ? new Date(now + 1_000) : due;
      const baseNotification = {
        title: reminder.title,
        body: `${recurrenceSummary(reminder, language)} - ${formatDue(reminder.nextDueAt, language)}`,
        sound: "default",
        actionTypeId: NATIVE_ACTION_TYPE,
        interruptionLevel: "timeSensitive" as const,
        extra: { source: "reminder-tracker", reminderId: reminder.id },
        threadIdentifier: "reminder-tracker",
        summaryArgument: labels.appName,
      };

      if (reminder.frequency === "daily") {
        return [{
          ...baseNotification,
          id: notificationIdFor(reminder.id),
          schedule: {
            at,
            on: { hour: due.getHours(), minute: due.getMinutes() },
            repeats: true,
            allowWhileIdle: true,
          },
        }];
      }

      if (reminder.frequency === "weekly") {
        return (reminder.daysOfWeek.length ? reminder.daysOfWeek : [due.getDay()]).map((day) => ({
          ...baseNotification,
          id: notificationIdFor(`${reminder.id}-${day}`),
          schedule: {
            at,
            on: { weekday: nativeWeekdays[day], hour: due.getHours(), minute: due.getMinutes() },
            repeats: true,
            allowWhileIdle: true,
          },
        }));
      }

      if (reminder.frequency === "monthly") {
        return [{
          ...baseNotification,
          id: notificationIdFor(reminder.id),
          schedule: {
            at,
            on: { day: Math.max(1, Math.min(31, reminder.monthlyDay)), hour: due.getHours(), minute: due.getMinutes() },
            repeats: true,
            allowWhileIdle: true,
          },
        }];
      }

      if (reminder.frequency === "hourly" && reminder.intervalHours === 1) {
        return [{
          ...baseNotification,
          id: notificationIdFor(reminder.id),
          schedule: { at, every: "hour" as const, repeats: true, allowWhileIdle: true },
        }];
      }

      return [{
        ...baseNotification,
        id: notificationIdFor(reminder.id),
        schedule: { at, allowWhileIdle: true },
      }];
    });

  if (notifications.length) {
    await LocalNotifications.schedule({ notifications });
  }
}

function sendBrowserNotification(reminder: Reminder, language: Language) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const body = `${recurrenceSummary(reminder, language)} - ${formatDue(reminder.nextDueAt, language)}`;
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
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [setupName, setSetupName] = useState(settings.username);
  const [draft, setDraft] = useState<ReminderDraft>(defaultDraft);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEnabled, setEditingEnabled] = useState(true);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<"default" | "granted" | "denied">("default");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "snoozed" | "done">("all");
  const [dueId, setDueId] = useState<string | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const language = settings.language;
  const labels = copy[language];
  const username = settings.username.trim();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const refreshPermission = async () => {
      if (isNativeNotificationsAvailable()) {
        const current = await LocalNotifications.checkPermissions();
        setNotificationPermission(current.display === "granted" ? "granted" : current.display === "denied" ? "denied" : "default");
        return;
      }

      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
      }
    };

    void refreshPermission();
  }, []);

  useEffect(() => {
    if (!isNativeNotificationsAvailable()) return;
    void registerNativeActions(language);
  }, [language]);

  useEffect(() => {
    if (!isNativeNotificationsAvailable()) return;
    void syncNativeNotifications(reminders, language);
  }, [language, reminders]);

  useEffect(() => {
    if (!isNativeNotificationsAvailable()) return;

    let removeListener: (() => Promise<void>) | undefined;
    LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
      const reminderId = action.notification.extra?.reminderId as string | undefined;
      if (!reminderId) return;

      if (action.actionId === "complete") {
        completeReminder(reminderId);
      }

      if (action.actionId === "snooze") {
        snoozeReminder(reminderId);
      }
    }).then((handle) => {
      removeListener = handle.remove;
    });

    return () => {
      void removeListener?.();
    };
  }, []);

  useEffect(() => {
    const checkDue = () => {
      const now = Date.now();
      const due = reminders.find((reminder) => reminder.enabled && new Date(reminder.nextDueAt).getTime() <= now);
      if (!due) return;

      setDueId((current) => current ?? due.id);
      const notificationKey = `${due.id}:${due.nextDueAt}`;
      if (!notifiedRef.current.has(notificationKey)) {
        notifiedRef.current.add(notificationKey);
        sendBrowserNotification(due, language);
      }
    };

    checkDue();
    const interval = window.setInterval(checkDue, 15_000);
    return () => window.clearInterval(interval);
  }, [language, reminders]);

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
    if (isNativeNotificationsAvailable()) {
      const permitted = await ensureNativeNotificationPermission();
      setNotificationPermission(permitted ? "granted" : "denied");
      await registerNativeActions(language);
      await syncNativeNotifications(reminders, language);
      return;
    }

    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const resetComposer = () => {
    setDraft(defaultDraft);
    setEditingId(null);
    setEditingEnabled(true);
    setComposerOpen(false);
  };

  const openNewReminder = () => {
    setDraft(defaultDraft);
    setEditingId(null);
    setEditingEnabled(true);
    setComposerOpen(true);
  };

  const openEditReminder = (reminder: Reminder) => {
    const { id, createdAt, nextDueAt, completedCount, lastCompletedAt, lastSnoozedAt, enabled, ...editableReminder } = reminder;
    void id;
    void createdAt;
    void nextDueAt;
    void completedCount;
    void lastCompletedAt;
    void lastSnoozedAt;

    setDraft(editableReminder);
    setEditingId(reminder.id);
    setEditingEnabled(enabled);
    setComposerOpen(true);
  };

  const saveReminder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) return;

    const cleanDraft = { ...draft, title: draft.title.trim() };
    if (!editingId) {
      setReminders((current) => [makeReminder(cleanDraft), ...current]);
      resetComposer();
      return;
    }

    setReminders((current) =>
      current.map((reminder) => {
        if (reminder.id !== editingId) return reminder;

        return {
          ...reminder,
          ...cleanDraft,
          enabled: editingEnabled,
          nextDueAt: editingEnabled ? getNextDue(cleanDraft).toISOString() : reminder.nextDueAt,
          lastSnoozedAt: undefined,
        };
      }),
    );
    setDueId((current) => (current === editingId ? null : current));
    resetComposer();
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

  const finishSetup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = setupName.trim();
    if (!trimmed) return;
    setSettings((current) => ({ ...current, username: trimmed }));
  };

  return (
    <main className="appShell">
      <section className="phoneSurface" aria-label={labels.appName}>
        <header className="topBar">
          <div>
            <p className="eyebrow">{labels.appName}</p>
            <h1>
              {labels.hello} {username || labels.usernamePlaceholder}
            </h1>
          </div>
          <div className="brandCharm" aria-hidden="true">
            <span className="miniBow" />
            <Heart size={24} fill="currentColor" />
          </div>
          <div className="topActions">
            <button
              className={`iconButton ${notificationPermission === "granted" ? "permissionGranted" : ""}`}
              onClick={requestNotifications}
              aria-label={notificationPermission === "granted" ? labels.notificationsOn : labels.enableNotifications}
              title={notificationPermission === "granted" ? labels.notificationsOn : labels.enableNotifications}
            >
              {notificationPermission === "granted" ? <Check size={21} /> : <Bell size={21} />}
            </button>
            <button
              className="iconButton"
              onClick={() => setSettingsOpen((current) => !current)}
              aria-label={labels.settings}
              title={labels.settings}
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {isSettingsOpen ? (
          <section className="settingsPanel" aria-label={labels.settings}>
            <div className="settingsPanelHeader">
              <span>
                <Settings size={18} />
                {labels.settings}
              </span>
              <button className="smallClose" onClick={() => setSettingsOpen(false)} aria-label="Close settings">
                <X size={17} />
              </button>
            </div>
            <label className="settingsField">
              <span>
                <User size={15} />
                {labels.username}
              </span>
              <input
                value={settings.username}
                onChange={(event) => setSettings({ ...settings, username: event.target.value })}
                placeholder={labels.usernamePlaceholder}
              />
            </label>
            <label className="settingsField">
              <span>
                <Languages size={15} />
                {labels.language}
              </span>
              <select
                value={settings.language}
                onChange={(event) => setSettings({ ...settings, language: event.target.value as Language })}
              >
                <option value="en">{labels.english}</option>
                <option value="es">{labels.spanish}</option>
              </select>
            </label>
            <button
              className={`settingsNotify ${notificationPermission === "granted" ? "granted" : ""}`}
              onClick={requestNotifications}
            >
              {notificationPermission === "granted" ? <Check size={18} /> : <Smartphone size={18} />}
              <span>{notificationPermission === "granted" ? labels.notificationsOn : labels.enableNotifications}</span>
            </button>
            <p className="settingsNote">
              {isNativeNotificationsAvailable() ? labels.nativeNotifications : labels.webNotifications}
            </p>
            {!isNativeNotificationsAvailable() ? <p className="settingsNote">{labels.nativeNote}</p> : null}
            <p className="settingsNote">{labels.soundLimitNote}</p>
          </section>
        ) : null}

        <section className="statusBand" aria-label={labels.notifications}>
          <div>
            <strong>{stats.active}</strong>
            <span>{labels.active}</span>
          </div>
          <div>
            <strong>{stats.dueToday}</strong>
            <span>{labels.today}</span>
          </div>
          <div>
            <strong>{stats.completed}</strong>
            <span>{labels.done}</span>
          </div>
        </section>

        <div className="toolbar">
          <label className="searchBox">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.search}
              aria-label={labels.search}
            />
          </label>
          <button className="addButton" onClick={openNewReminder}>
            <Plus size={20} />
            <span>{labels.new}</span>
          </button>
        </div>

        <nav className="filters" aria-label="Reminder filters">
          {(["all", "today", "snoozed", "done"] as const).map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {labels.filters[item]}
            </button>
          ))}
        </nav>

        <section className="reminderList" aria-live="polite">
          {visibleReminders.length === 0 ? (
            <div className="emptyState">
              <CalendarClock size={42} />
              <h2>{labels.noReminders}</h2>
              <p>{labels.noRemindersHelp}</p>
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
                    aria-label={
                      reminder.enabled
                        ? `${labels.complete} ${reminder.title}`
                        : `${labels.done} ${reminder.title}`
                    }
                    disabled={!reminder.enabled}
                  >
                    {reminder.enabled ? <Circle size={22} /> : <Check size={22} />}
                  </button>
                  <div className="reminderBody">
                    <div className="cardTop">
                      <div className="categoryPill">
                        <Icon size={14} />
                        {labels.categories[reminder.category as keyof typeof labels.categories] ?? reminder.category}
                      </div>
                      <span className={`priorityDot ${priorityTone(reminder.priority)}`} />
                    </div>
                    <h2>{reminder.title}</h2>
                    {reminder.notes ? <p>{reminder.notes}</p> : null}
                    <div className="metaGrid">
                      <span>
                        <Clock3 size={15} />
                        {formatDue(reminder.nextDueAt, language)}
                      </span>
                      <span>
                        <TimerReset size={15} />
                        {recurrenceSummary(reminder, language)}
                      </span>
                    </div>
                  </div>
                  <div className="cardActions">
                    <button
                      className="editButton"
                      onClick={() => openEditReminder(reminder)}
                      aria-label={`${labels.edit} ${reminder.title}`}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      className="deleteButton"
                      onClick={() => removeReminder(reminder.id)}
                      aria-label={`${labels.delete} ${reminder.title}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </section>

      {!username ? (
        <div className="alertBackdrop" role="dialog" aria-modal="true" aria-labelledby="setup-title">
          <form className="setupDialog" onSubmit={finishSetup}>
            <div className="pulseIcon compact">
              <User size={28} />
            </div>
            <p className="eyebrow">{labels.appName}</p>
            <h2 id="setup-title">{labels.setNameTitle}</h2>
            <p>{labels.setNameBody}</p>
            <label className="field wide">
              <span>{labels.username}</span>
              <input
                value={setupName}
                onChange={(event) => setSetupName(event.target.value)}
                placeholder={labels.usernamePlaceholder}
                autoFocus
                required
              />
            </label>
            <label className="field wide">
              <span>{labels.language}</span>
              <select
                value={settings.language}
                onChange={(event) => setSettings({ ...settings, language: event.target.value as Language })}
              >
                <option value="en">{labels.english}</option>
                <option value="es">{labels.spanish}</option>
              </select>
            </label>
            <button className="primaryAction" type="submit">
              <Check size={20} />
              {labels.getStarted}
            </button>
          </form>
        </div>
      ) : null}

      {isComposerOpen ? (
        <div className="sheetBackdrop" role="presentation">
          <form className="composerSheet" onSubmit={saveReminder}>
            <div className="sheetHeader">
              <div>
                <p className="eyebrow">{editingId ? labels.edit : labels.newReminder}</p>
                <h2>{labels.setRhythm}</h2>
              </div>
              <button type="button" className="iconButton ghost" onClick={resetComposer} aria-label="Close">
                <X size={21} />
              </button>
            </div>

            <label className="field wide">
              <span>{labels.title}</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder={labels.titlePlaceholder}
                required
              />
            </label>

            <label className="field wide">
              <span>{labels.notes}</span>
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                placeholder={labels.optionalDetails}
                rows={3}
              />
            </label>

            <div className="fieldGroup">
              <label className="field">
                <span>{labels.frequency}</span>
                <select
                  value={draft.frequency}
                  onChange={(event) => setDraft({ ...draft, frequency: event.target.value as Frequency })}
                >
                  {Object.entries(labels.frequencyLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{labels.snooze}</span>
                <select
                  value={draft.snoozeMinutes}
                  onChange={(event) => setDraft({ ...draft, snoozeMinutes: Number(event.target.value) })}
                >
                  {[5, 10, 15, 20, 30, 60].map((minutes) => (
                    <option value={minutes} key={minutes}>
                      {minutes} {labels.minute}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {draft.frequency === "hourly" ? (
              <label className="field wide">
                <span>{labels.every}</span>
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
                <span>{labels.time}</span>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) => setDraft({ ...draft, time: event.target.value })}
                />
              </label>
            ) : null}

            {draft.frequency === "specific" ? (
              <label className="field wide">
                <span>{labels.date}</span>
                <input
                  type="date"
                  value={draft.specificDate}
                  onChange={(event) => setDraft({ ...draft, specificDate: event.target.value })}
                />
              </label>
            ) : null}

            {draft.frequency === "weekly" ? (
              <div className="dayPicker" aria-label="Weekly days">
                {labels.days.map((label, index) => (
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
                <span>{labels.dayOfMonth}</span>
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
              {editingId ? (
                <label className="field">
                  <span>{labels.status}</span>
                  <select
                    value={editingEnabled ? "active" : "completed"}
                    onChange={(event) => setEditingEnabled(event.target.value === "active")}
                  >
                    <option value="active">{labels.activeStatus}</option>
                    <option value="completed">{labels.completedStatus}</option>
                  </select>
                </label>
              ) : null}
              <label className="field">
                <span>{labels.priority}</span>
                <select
                  value={draft.priority}
                  onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}
                >
                  {Object.entries(labels.priorityLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{labels.list}</span>
                <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
                  {Object.keys(categoryIcons).map((category) => (
                    <option value={category} key={category}>
                      {labels.categories[category as keyof typeof labels.categories] ?? category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="primaryAction" type="submit">
              {editingId ? <Check size={20} /> : <Plus size={20} />}
              {editingId ? labels.saveChanges : labels.createReminder}
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
            <p className="eyebrow">{labels.reminderDue}</p>
            <h2 id="due-title">{dueReminder.title}</h2>
            <p>{dueReminder.notes || recurrenceSummary(dueReminder, language)}</p>
            <div className="dialogActions">
              <button onClick={() => completeReminder(dueReminder.id)} className="completeAction">
                <Check size={22} />
                {labels.complete}
              </button>
              <button onClick={() => snoozeReminder(dueReminder.id)} className="snoozeAction">
                <TimerReset size={22} />
                {labels.snooze} {dueReminder.snoozeMinutes}{" "}
                {labels.minute}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
