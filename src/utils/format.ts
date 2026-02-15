//Omit
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keysToOmit: K[]
): Omit<T, K> {
  const newObj: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const currentKey = key as keyof T;
      if (!keysToOmit.includes(currentKey as K)) {
        newObj[currentKey] = obj[currentKey];
      }
    }
  }
  return newObj as Omit<T, K>;
}

//Date and Time
export function formatDate(date: Date | string) {
  const d = new Date(date);

  // Use Intl for fixed time zone formatting
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/New_York", // Fixed NY time
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short", // Adds EST/EDT
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(d);

  // Extract day and add suffix
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  // Build string manually to preserve suffix
  return parts
    .map((p) => {
      if (p.type === "day") return `${day}${suffix}`;
      return p.value;
    })
    .join("");
}

//Name
export function capitalizeWords(str: string) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
