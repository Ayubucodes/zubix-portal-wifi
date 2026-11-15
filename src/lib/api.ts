const API_BASE = "https://api.zubix.win";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (init.body !== undefined && !headers.has("content-type")) headers.set("content-type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/v1${path}`, { ...init, headers });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK", "Network unavailable");
  }

  if (!response.ok) {
    const envelope = (await response.json().catch(() => ({}))) as ErrorEnvelope;
    throw new ApiError(
      response.status,
      envelope.error?.code ?? "REQUEST_FAILED",
      envelope.error?.message ?? `Request failed with status ${response.status}`,
    );
  }
  return (await response.json()) as T;
}

export interface PublicPackage {
  id: string;
  name: string;
  description: string | null;
  durationValue: number;
  durationUnit: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH";
  priceTzs: number;
  dataLimitMb: number | null;
  downloadKbps: number | null;
  uploadKbps: number | null;
  maxDevices: number;
}

export interface PortalConfig {
  appName: string;
  supportPhone: string | null;
  providers: Array<{ code: "SELCOM" | "CLICKPESA" | "MOCK"; name: string }>;
}

export interface InitiatedPayment {
  reference: string;
  status: string;
  amountTzs: number;
  packageName: string | null;
  providerCode: string | null;
}

export type PaymentState = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED" | "REFUNDED";

export interface PaymentStatusResponse {
  reference: string;
  status: PaymentState;
  amountTzs: number;
  packageName: string | null;
  failureReason: string | null;
  providerCode: string | null;
  subscriptionId: string | null;
  expiresAt: string | null;
}

export interface RedeemResponse {
  subscriptionId: string;
  packageName: string;
  expiresAt: string | null;
  customerPhone: string;
}

export type ConnectResponse = { status: "AUTHORIZED"; expiresAt: string } | { status: "NOT_CONFIGURED" };
