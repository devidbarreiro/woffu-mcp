/**
 * Woffu API client — TypeScript port of the Python reference implementation.
 * Uses native fetch (Node 18+). No external HTTP dependencies.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface WoffuUser {
  userId: number;
  email: string;
  name: string;
  companyId: number;
  vacation: VacationBalance;
}

export interface VacationBalance {
  allocated: number;
  used: number;
  available: number;
  enjoyed: number;
  balance: number;
  accumulated: number;
}

export interface Sign {
  time: string;
  type: "entrada" | "salida";
  device: string;
}

export interface PresenceDay {
  date: string;
  isHoliday: boolean;
  isWeekend: boolean;
  isPresence: boolean;
  holidayName: string | null;
  startTime: string | null;
  endTime: string | null;
  scheduleHours: number;
}

export interface DiaryDay {
  date: string;
  startTime: string | null;
  endTime: string | null;
  hoursDiff: string;
  description: string | null;
}

export interface ToggleResult {
  action: "entrada" | "salida" | "skip";
  reason?: string;
  user: string;
  time?: string;
  signsCount?: number;
}

export interface StatusResult {
  user: string;
  status: "trabajando" | "fuera";
  signsToday: Sign[];
  signsCount: number;
  schedule: string | null;
  isHoliday: boolean;
  vacation: VacationBalance;
}

export interface WeekDay {
  date: string;
  hoursDiff: string;
  isHoliday: boolean;
  holidayName: string | null;
  scheduleHours: number;
}

export interface WeekSummary {
  user: string;
  week: string;
  days: WeekDay[];
}

export interface HolidaysResult {
  user: string;
  year: number;
  holidays: PresenceDay[];
  vacation: VacationBalance;
}

// ── Client ──────────────────────────────────────────────────────────────────

export class WoffuClient {
  private baseUrl: string;

  constructor(company: string) {
    this.baseUrl = `https://${company}.woffu.com`;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Woffu login failed (${res.status}): ${text || res.statusText}`,
      );
    }

    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  private headers(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }

  // ── User ─────────────────────────────────────────────────────────────────

  async getUser(token: string): Promise<WoffuUser> {
    const res = await fetch(`${this.baseUrl}/api/users`, {
      headers: this.headers(token),
    });
    if (!res.ok) throw new Error(`Failed to get user (${res.status})`);

    const data = (await res.json()) as Record<string, unknown>;
    return {
      userId: data.UserId as number,
      email: data.Email as string,
      name: data.FullName as string,
      companyId: data.CompanyId as number,
      vacation: {
        allocated: (data.AllocatedDays as number) ?? 0,
        used: (data.UsedDays as number) ?? 0,
        available: (data.AvailableDays as number) ?? 0,
        enjoyed: (data.EnjoyedDays as number) ?? 0,
        balance: (data.BalanceDays as number) ?? 0,
        accumulated: (data.AccumulatedDays as number) ?? 0,
      },
    };
  }

  // ── Signs ────────────────────────────────────────────────────────────────

  async getSignsToday(token: string): Promise<Sign[]> {
    const res = await fetch(`${this.baseUrl}/api/signs`, {
      headers: this.headers(token),
    });
    if (!res.ok) throw new Error(`Failed to get signs (${res.status})`);

    const data = (await res.json()) as Array<Record<string, unknown>>;
    return data.map((s) => ({
      time: s.ShortTime as string,
      type: (s.SignIn ? "entrada" : "salida") as "entrada" | "salida",
      device: (s.DeviceId as string) ?? "?",
    }));
  }

  // ── Presence ─────────────────────────────────────────────────────────────

  async getPresence(
    token: string,
    userId: number,
    fromDate: string,
    toDate: string,
  ): Promise<PresenceDay[]> {
    const params = new URLSearchParams({
      fromDate,
      toDate,
      pageIndex: "0",
      pageSize: "31",
    });
    const res = await fetch(
      `${this.baseUrl}/api/users/${userId}/diaries/presence?${params}`,
      { headers: this.headers(token) },
    );
    if (!res.ok) throw new Error(`Failed to get presence (${res.status})`);

    const body = (await res.json()) as { Diaries?: Array<Record<string, unknown>> };
    const diaries = body.Diaries ?? [];

    return diaries.map((d) => ({
      date: (d.Date as string).slice(0, 10),
      isHoliday: (d.IsHoliday as boolean) ?? false,
      isWeekend: (d.IsWeekend as boolean) ?? false,
      isPresence: (d.IsPresence as boolean) ?? false,
      holidayName: d.IsHoliday ? (d.Name as string) ?? null : null,
      startTime: (d.StartTime as string) ?? null,
      endTime: (d.EndTime as string) ?? null,
      scheduleHours: (d.ScheduleHours as number) ?? 0,
    }));
  }

  async getPresenceToday(
    token: string,
    userId: number,
  ): Promise<PresenceDay | null> {
    const today = formatDate(new Date());
    const days = await this.getPresence(token, userId, today, today);
    return days[0] ?? null;
  }

  // ── Diaries (worked hours) ──────────────────────────────────────────────

  async getDiaries(
    token: string,
    userId: number,
    fromDate: string,
    toDate: string,
  ): Promise<DiaryDay[]> {
    const params = new URLSearchParams({ fromDate, toDate });
    const res = await fetch(
      `${this.baseUrl}/api/users/${userId}/diaries?${params}`,
      { headers: this.headers(token) },
    );
    if (!res.ok) throw new Error(`Failed to get diaries (${res.status})`);

    const data = (await res.json()) as Array<Record<string, unknown>>;
    return data.map((d) => ({
      date: (d.Date as string).slice(0, 10),
      startTime: (d.StartTime as string) ?? null,
      endTime: (d.EndTime as string) ?? null,
      hoursDiff: (d.HoursDiffText as string) ?? "0h",
      description: (d.Description as string) ?? null,
    }));
  }

  // ── Clock in/out ────────────────────────────────────────────────────────

  async postSign(token: string, userId: number): Promise<unknown> {
    const now = new Date();
    const dateStr = formatDateTimeWithOffset(now);

    const body = {
      DeviceId: "WebApp",
      StartDate: dateStr,
      EndDate: dateStr,
      TimezoneOffset: -120,
      UserId: userId,
    };

    const res = await fetch(`${this.baseUrl}/api/svc/signs/signs`, {
      method: "POST",
      headers: {
        ...this.headers(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Failed to post sign (${res.status}): ${text}`);
    }

    return res.json();
  }

  // ── High-level operations ───────────────────────────────────────────────

  async toggle(
    email: string,
    password: string,
  ): Promise<ToggleResult> {
    const token = await this.login(email, password);
    const user = await this.getUser(token);
    const presence = await this.getPresenceToday(token, user.userId);

    if (presence && (presence.isHoliday || presence.isWeekend)) {
      return {
        action: "skip",
        reason: "holiday_or_weekend",
        user: user.name,
      };
    }

    const signs = await this.getSignsToday(token);
    const isClockedIn = signs.length % 2 === 1;

    await this.postSign(token, user.userId);
    const action = isClockedIn ? "salida" : "entrada";

    return {
      action,
      user: user.name,
      time: formatTime(new Date()),
      signsCount: signs.length + 1,
    };
  }

  async clockIn(
    email: string,
    password: string,
  ): Promise<ToggleResult> {
    const token = await this.login(email, password);
    const user = await this.getUser(token);
    const presence = await this.getPresenceToday(token, user.userId);

    if (presence && (presence.isHoliday || presence.isWeekend)) {
      return {
        action: "skip",
        reason: "holiday_or_weekend",
        user: user.name,
      };
    }

    const signs = await this.getSignsToday(token);
    const isClockedIn = signs.length % 2 === 1;

    if (isClockedIn) {
      return {
        action: "skip",
        reason: "already_clocked_in",
        user: user.name,
        signsCount: signs.length,
      };
    }

    await this.postSign(token, user.userId);
    return {
      action: "entrada",
      user: user.name,
      time: formatTime(new Date()),
      signsCount: signs.length + 1,
    };
  }

  async clockOut(
    email: string,
    password: string,
  ): Promise<ToggleResult> {
    const token = await this.login(email, password);
    const user = await this.getUser(token);
    const presence = await this.getPresenceToday(token, user.userId);

    if (presence && (presence.isHoliday || presence.isWeekend)) {
      return {
        action: "skip",
        reason: "holiday_or_weekend",
        user: user.name,
      };
    }

    const signs = await this.getSignsToday(token);
    const isClockedIn = signs.length % 2 === 1;

    if (!isClockedIn) {
      return {
        action: "skip",
        reason: "not_clocked_in",
        user: user.name,
        signsCount: signs.length,
      };
    }

    await this.postSign(token, user.userId);
    return {
      action: "salida",
      user: user.name,
      time: formatTime(new Date()),
      signsCount: signs.length + 1,
    };
  }

  async status(
    email: string,
    password: string,
  ): Promise<StatusResult> {
    const token = await this.login(email, password);
    const user = await this.getUser(token);
    const signs = await this.getSignsToday(token);
    const presence = await this.getPresenceToday(token, user.userId);
    const isClockedIn = signs.length % 2 === 1;

    return {
      user: user.name,
      status: isClockedIn ? "trabajando" : "fuera",
      signsToday: signs,
      signsCount: signs.length,
      schedule: presence
        ? `${presence.startTime} - ${presence.endTime}`
        : null,
      isHoliday: presence?.isHoliday ?? false,
      vacation: user.vacation,
    };
  }

  async weekSummary(
    email: string,
    password: string,
  ): Promise<WeekSummary> {
    const token = await this.login(email, password);
    const user = await this.getUser(token);

    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const fromDate = formatDate(monday);
    const toDate = formatDate(friday);

    const [diaries, presence] = await Promise.all([
      this.getDiaries(token, user.userId, fromDate, toDate),
      this.getPresence(token, user.userId, fromDate, toDate),
    ]);

    const days: WeekDay[] = [];
    for (let i = 0; i < Math.min(diaries.length, presence.length); i++) {
      const diary = diaries[i]!;
      const pres = presence[i]!;
      days.push({
        date: diary.date,
        hoursDiff: diary.hoursDiff,
        isHoliday: pres.isHoliday,
        holidayName: pres.holidayName,
        scheduleHours: pres.scheduleHours,
      });
    }

    return { user: user.name, week: `${fromDate} → ${toDate}`, days };
  }

  async holidays(
    email: string,
    password: string,
    year?: number,
  ): Promise<HolidaysResult> {
    const token = await this.login(email, password);
    const user = await this.getUser(token);
    const targetYear = year ?? new Date().getFullYear();

    const fromDate = `${targetYear}-01-01`;
    const toDate = `${targetYear}-12-31`;

    // Fetch full year in pages of 31 days
    const allPresence: PresenceDay[] = [];
    let current = new Date(fromDate);
    const end = new Date(toDate);

    while (current <= end) {
      const pageFrom = formatDate(current);
      const pageTo = formatDate(
        new Date(Math.min(current.getTime() + 30 * 86400000, end.getTime())),
      );
      const page = await this.getPresence(token, user.userId, pageFrom, pageTo);
      allPresence.push(...page);
      current = new Date(current.getTime() + 31 * 86400000);
    }

    const holidays = allPresence.filter((d) => d.isHoliday && !d.isWeekend);

    return {
      user: user.name,
      year: targetYear,
      holidays,
      vacation: user.vacation,
    };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDateTimeWithOffset(d: Date): string {
  // Produce CET/CEST-style offset: +02:00
  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const oh = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const om = String(absOffset % 60).padStart(2, "0");

  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");

  return `${y}-${mo}-${day}T${h}:${mi}:${s}${sign}${oh}:${om}`;
}
