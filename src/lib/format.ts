export const date = (value: string) =>
  new Date(value).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
export const time = (value: string) =>
  new Date(value).toLocaleString("zh-CN", { timeZone: "UTC", hour12: false });
export const unique = (values: string[]) => [...new Set(values)].sort();
