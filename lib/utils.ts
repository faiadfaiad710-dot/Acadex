import clsx, { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(value?: unknown) {
  if (!value) return "-";

  let date: Date;

  if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  } else if (
    typeof value === "object" &&
    value !== null &&
    "_seconds" in value &&
    typeof (value as { _seconds?: unknown })._seconds === "number"
  ) {
    date = new Date((value as { _seconds: number })._seconds * 1000);
  } else {
    return "-";
  }

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function truncate(value: string, length = 40) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}…`;
}

export function bytesToSize(bytes?: number) {
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let size = bytes;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
}

export function getDownloadUrl(url?: string) {
  if (!url) return "#";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
}

export function getFileOpenHref(id: string) {
  return `/api/files/open?id=${encodeURIComponent(id)}`;
}

export function getFileViewerHref(id: string) {
  return `/viewer?type=file&id=${encodeURIComponent(id)}`;
}

export function getFileDownloadHref(id: string) {
  return `/api/files/download?id=${encodeURIComponent(id)}`;
}

export function getSubjectResourceViewerHref(id: string) {
  return `/viewer?type=resource&id=${encodeURIComponent(id)}`;
}

export function getSubjectResourceDownloadHref(id: string) {
  return `/api/subject-resources/download?id=${encodeURIComponent(id)}`;
}

export function getNoticeViewerHref(id: string) {
  return `/viewer?type=notice&id=${encodeURIComponent(id)}`;
}

export function getNoticeDownloadHref(id: string) {
  return `/api/notices/download?id=${encodeURIComponent(id)}`;
}
