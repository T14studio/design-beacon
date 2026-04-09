export function getBackendBaseUrl(): string {
  const envUrl = import.meta.env.VITE_AXIS_WEBHOOK_URL as string | undefined;
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (envUrl && envUrl.includes("/axis/turn")) {
    return envUrl.replace("/axis/turn", "");
  }
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl.replace(/\/+$/, "");
  }

  return isLocal ? "http://localhost:8000" : "https://design-beacon.onrender.com";
}

