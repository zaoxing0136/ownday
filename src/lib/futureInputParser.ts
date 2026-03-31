import { addDays, addWeeks, format, startOfDay, startOfWeek } from "date-fns";

export interface ParsedFutureInput {
  rawInput: string;
  date: string;
  time: string;
  timeHint: string;
  title: string;
}

const PERIOD_WORDS = ["上午", "早上", "中午", "下午", "晚上"] as const;
const WEEKDAY_MAP: Record<string, number> = {
  一: 0,
  二: 1,
  三: 2,
  四: 3,
  五: 4,
  六: 5,
  日: 6,
  天: 6,
};

const CHINESE_NUMBER_MAP: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function normalizeInput(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

function removeFragment(text: string, fragment: string) {
  if (!fragment) return text;
  return text.replace(fragment, " ");
}

function cleanupTitle(text: string) {
  return text
    .replace(/[，。,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

function parseChineseNumberToken(token: string) {
  if (!token) return null;
  if (/^\d+$/.test(token)) return Number.parseInt(token, 10);

  if (token === "十") return 10;

  if (token.includes("十")) {
    const [tensText, onesText] = token.split("十");
    const tens = tensText ? CHINESE_NUMBER_MAP[tensText] : 1;
    const ones = onesText ? CHINESE_NUMBER_MAP[onesText] : 0;
    if (tens === undefined || ones === undefined) return null;
    return tens * 10 + ones;
  }

  return CHINESE_NUMBER_MAP[token] ?? null;
}

function adjustHourByPeriod(hour: number, period: string) {
  if (period === "上午" || period === "早上") {
    return hour === 12 ? 0 : hour;
  }

  if (period === "中午") {
    if (hour >= 1 && hour <= 6) return hour + 12;
    return hour;
  }

  if (period === "下午" || period === "晚上") {
    return hour < 12 ? hour + 12 : hour;
  }

  return hour;
}

function parseDateFragment(input: string, baseDate: Date) {
  const relativeMatch = input.match(/(今天|明天|后天)/);
  if (relativeMatch) {
    const offsetMap: Record<string, number> = {
      今天: 0,
      明天: 1,
      后天: 2,
    };

    return {
      date: toDateKey(addDays(baseDate, offsetMap[relativeMatch[1]])),
      fragment: relativeMatch[0],
    };
  }

  const weekMatch = input.match(/(下周|本周|这周)([一二三四五六日天])/);
  if (weekMatch) {
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const offset = WEEKDAY_MAP[weekMatch[2]];
    const weekBase = weekMatch[1] === "下周" ? addWeeks(weekStart, 1) : weekStart;

    return {
      date: toDateKey(addDays(weekBase, offset)),
      fragment: weekMatch[0],
    };
  }

  const absoluteMatch = input.match(/(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})[日号]?/);
  if (absoluteMatch) {
    const explicitYear = absoluteMatch[1] ? Number.parseInt(absoluteMatch[1], 10) : null;
    const month = Number.parseInt(absoluteMatch[2], 10);
    const day = Number.parseInt(absoluteMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const candidate = new Date(explicitYear ?? baseDate.getFullYear(), month - 1, day);
      if (!explicitYear && startOfDay(candidate) < startOfDay(baseDate)) {
        candidate.setFullYear(candidate.getFullYear() + 1);
      }

      return {
        date: toDateKey(candidate),
        fragment: absoluteMatch[0],
      };
    }
  }

  return {
    date: "",
    fragment: "",
  };
}

function parseTimeFragment(input: string) {
  const periodColonMatch = input.match(/(上午|早上|中午|下午|晚上)\s*(\d{1,2})[:：](\d{2})/);
  if (periodColonMatch) {
    const period = periodColonMatch[1];
    const hour = adjustHourByPeriod(Number.parseInt(periodColonMatch[2], 10), period);
    const minute = Number.parseInt(periodColonMatch[3], 10);

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return {
        time: `${padTime(hour)}:${padTime(minute)}`,
        timeHint: "",
        fragment: periodColonMatch[0],
      };
    }
  }

  const colonMatch = input.match(/(\d{1,2})[:：](\d{2})/);
  if (colonMatch) {
    const hour = Number.parseInt(colonMatch[1], 10);
    const minute = Number.parseInt(colonMatch[2], 10);

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return {
        time: `${padTime(hour)}:${padTime(minute)}`,
        timeHint: "",
        fragment: colonMatch[0],
      };
    }
  }

  const pointMatch = input.match(
    /(?:(上午|早上|中午|下午|晚上))?\s*([零〇一二三四五六七八九十两\d]{1,3})点(?:(半)|([零〇一二三四五六七八九十两\d]{1,3})分?)?/
  );
  if (pointMatch) {
    const period = pointMatch[1] || "";
    const hour = parseChineseNumberToken(pointMatch[2]);
    const minute = pointMatch[3] ? 30 : parseChineseNumberToken(pointMatch[4] || "") ?? 0;

    if (hour !== null && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return {
        time: `${padTime(adjustHourByPeriod(hour, period))}:${padTime(minute)}`,
        timeHint: "",
        fragment: pointMatch[0],
      };
    }
  }

  const periodOnlyMatch = input.match(/(上午|早上|中午|下午|晚上)/);
  if (periodOnlyMatch) {
    return {
      time: "",
      timeHint: periodOnlyMatch[1],
      fragment: periodOnlyMatch[0],
    };
  }

  return {
    time: "",
    timeHint: "",
    fragment: "",
  };
}

export function parseFutureQuickInput(rawInput: string, baseDate = new Date()): ParsedFutureInput {
  const normalizedInput = normalizeInput(rawInput);
  if (!normalizedInput) {
    return {
      rawInput: "",
      date: "",
      time: "",
      timeHint: "",
      title: "",
    };
  }

  const dateResult = parseDateFragment(normalizedInput, baseDate);
  let workingText = removeFragment(normalizedInput, dateResult.fragment);

  const timeResult = parseTimeFragment(workingText);
  workingText = removeFragment(workingText, timeResult.fragment);

  return {
    rawInput: normalizedInput,
    date: dateResult.date,
    time: timeResult.time,
    timeHint: timeResult.timeHint,
    title: cleanupTitle(workingText),
  };
}

export function hasDetectedPeriod(rawInput: string) {
  return PERIOD_WORDS.some((period) => rawInput.includes(period));
}
