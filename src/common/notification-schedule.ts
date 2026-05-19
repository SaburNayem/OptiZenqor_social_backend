export type NotificationScheduleInput = {
  schedule?: string;
  scheduleMode?: string;
  deliveryMode?: string;
  sendNow?: boolean;
  scheduledAt?: string;
  sendAt?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  timezoneOffsetMinutes?: number;
  status?: string;
};

export type NormalizedNotificationSchedule = {
  schedule: string;
  status: string;
  scheduleMode: 'now' | 'later' | 'custom';
  scheduledAt: Date | null;
  displayTime: string;
};

export function normalizeNotificationSchedule(
  input: NotificationScheduleInput,
  fallback?: { schedule?: string | null; status?: string | null },
): NormalizedNotificationSchedule {
  const mode = normalizeScheduleMode(input);
  const explicitSchedule = firstString(input.scheduledAt, input.sendAt, input.schedule);
  const combinedDateTime = combineDateAndTime(
    input.scheduleDate,
    input.scheduleTime,
    input.timezoneOffsetMinutes,
  );

  if (mode === 'now') {
    const now = new Date();
    return {
      schedule: now.toISOString(),
      status: 'sent',
      scheduleMode: 'now',
      scheduledAt: now,
      displayTime: 'Now',
    };
  }

  const selectedDate = combinedDateTime ?? parseDate(explicitSchedule);
  if (mode === 'later' || combinedDateTime || input.scheduledAt || input.sendAt) {
    if (!selectedDate) {
      throw new Error('Choose a valid later date and time.');
    }
    return {
      schedule: selectedDate.toISOString(),
      status: input.status?.trim() || 'scheduled',
      scheduleMode: 'later',
      scheduledAt: selectedDate,
      displayTime: selectedDate.toISOString(),
    };
  }

  const fallbackSchedule = fallback?.schedule?.trim();
  if (!explicitSchedule?.trim() && !fallbackSchedule) {
    const now = new Date();
    return {
      schedule: now.toISOString(),
      status: 'sent',
      scheduleMode: 'now',
      scheduledAt: now,
      displayTime: 'Now',
    };
  }
  const schedule = explicitSchedule?.trim() || fallbackSchedule || new Date().toISOString();
  const parsedSchedule = parseDate(schedule);
  const status = input.status?.trim() || fallback?.status?.trim() || 'scheduled';

  return {
    schedule: parsedSchedule?.toISOString() ?? schedule,
    status,
    scheduleMode: parsedSchedule ? 'later' : 'custom',
    scheduledAt: parsedSchedule,
    displayTime: parsedSchedule?.toISOString() ?? schedule,
  };
}

export function describeNotificationSchedule(schedule: string, status: string) {
  const scheduledAt = parseDate(schedule);
  const normalizedStatus = status.trim().toLowerCase();
  const scheduleMode =
    normalizedStatus === 'sent'
      ? 'now'
      : scheduledAt
        ? 'later'
        : 'custom';

  return {
    scheduleMode,
    scheduledAt: scheduledAt?.toISOString() ?? null,
    scheduleLabel:
      normalizedStatus === 'sent'
        ? 'Sent now'
        : scheduledAt
          ? scheduledAt.toISOString()
          : schedule,
    sendNow: normalizedStatus === 'sent',
    sendLater: normalizedStatus !== 'sent',
  };
}

function normalizeScheduleMode(input: NotificationScheduleInput) {
  if (input.sendNow === true) {
    return 'now';
  }
  const rawMode = firstString(input.scheduleMode, input.deliveryMode)?.toLowerCase();
  if (rawMode === 'now' || rawMode === 'send_now' || rawMode === 'immediate') {
    return 'now';
  }
  if (rawMode === 'later' || rawMode === 'schedule' || rawMode === 'scheduled') {
    return 'later';
  }
  const schedule = input.schedule?.trim().toLowerCase();
  if (schedule === 'now' || schedule === 'send_now' || schedule === 'immediate') {
    return 'now';
  }
  return '';
}

function firstString(...values: Array<string | undefined | null>) {
  return values.find((value) => value?.trim())?.trim();
}

function parseDate(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || ['now', 'send_now', 'immediate'].includes(trimmed.toLowerCase())) {
    return null;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function combineDateAndTime(
  scheduleDate?: string,
  scheduleTime?: string,
  timezoneOffsetMinutes?: number,
) {
  const date = scheduleDate?.trim();
  const time = scheduleTime?.trim();
  if (!date || !time) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!match || !timeMatch) {
    return null;
  }

  const [, year, month, day] = match;
  const [, hour, minute, second = '0'] = timeMatch;
  const utcMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  const offsetMs =
    typeof timezoneOffsetMinutes === 'number'
      ? timezoneOffsetMinutes * 60 * 1000
      : 0;
  const dateTime = new Date(utcMs + offsetMs);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}
