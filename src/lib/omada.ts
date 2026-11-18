import { readStore, writeStore } from "./storage";

/**
 * The Omada controller sends the customer here with the device and access point details in the
 * address. They are kept for the rest of the visit, because the address changes as the customer
 * moves between pages.
 */
export interface OmadaParams {
  clientMac: string;
  clientIp: string | null;
  apMac: string;
  ssidName: string;
  radioId: 0 | 1;
  redirectUrl: string | null;
}

const KEY = "zubix.omada";

export function captureOmadaParams(): OmadaParams | null {
  const query = new URLSearchParams(window.location.search);
  const clientMac = query.get("clientMac");
  const apMac = query.get("apMac");
  if (clientMac && apMac) {
    const params: OmadaParams = {
      clientMac,
      clientIp: query.get("clientIp"),
      apMac,
      ssidName: query.get("ssidName") ?? "",
      radioId: query.get("radioId") === "1" ? 1 : 0,
      redirectUrl: safeRedirect(query.get("redirectUrl")),
    };
    writeStore(KEY, JSON.stringify(params));
    return params;
  }
  return readStoredParams();
}

export function readStoredParams(): OmadaParams | null {
  const raw = readStore(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OmadaParams;
  } catch {
    return null;
  }
}

/** Only plain web addresses are followed after sign-in. */
function safeRedirect(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
