import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readPref, writePref } from "../lib/storage";

export type Lang = "en" | "sw";

const en = {
  tagline: "Wi-Fi by the hour, day or week",
  headline: "Pick a pass. Pay with your phone.",
  subhead: "Pay with mobile money and your time starts as soon as the payment is confirmed.",
  fact1: "Pay with mobile money",
  fact2: "No account or password",
  fact3: "Time starts when payment is confirmed",
  language: "Language",
  wifiNetwork: (name: string) => `Wi-Fi: ${name}`,
  tabBuy: "Buy a pass",
  tabVoucher: "Use a voucher",
  loading: "Loading",
  passesError: "We couldn't load the passes. Check that you are connected to the Wi-Fi and try again.",
  retry: "Try again",
  noPassesTitle: "No passes are on sale right now",
  noPassesBody: "Ask staff for a voucher, then use the Use a voucher tab.",
  bestValue: "Best value",
  unlimitedData: "Unlimited data",
  dataLimit: (mb: number) => (mb >= 1024 ? `${Number((mb / 1024).toFixed(1))} GB data` : `${mb} MB data`),
  speedUpTo: (kbps: number) => `Up to ${kbps >= 1000 ? Number((kbps / 1000).toFixed(1)) + " Mbps" : kbps + " kbps"}`,
  devices: (n: number) => (n === 1 ? "1 device" : `${n} devices`),
  buy: "Buy",
  buyFor: (price: string) => `Buy for ${price}`,
  back: "Back",
  yourPass: "Your pass",
  phoneLabel: "Mobile money number",
  phoneHint: "We'll send the payment request to this number.",
  phoneInvalid: "Enter a valid Tanzanian mobile number, for example 0712 345 678.",
  payWith: "Pay with",
  providerMobile: "Mobile money",
  providerMock: "Test payment (no real money)",
  testBanner: "Test mode. No real money is used.",
  pay: (price: string) => `Pay ${price}`,
  paying: "Sending request",
  noProviders: "Payments are not available right now. Ask staff for a voucher.",
  passUnavailable: "This pass is no longer on sale.",
  pendingTitle: "Approve the payment on your phone",
  yourPhone: "your phone",
  step1: (phone: string) => `Look for the mobile money prompt on ${phone}.`,
  step2: (amount: string) => `Enter your PIN to pay ${amount}.`,
  autoUpdate: "This page updates by itself when the payment is confirmed.",
  slowHint: "No prompt yet? Check that the number is right and has enough balance, then start again.",
  startOver: "Start over",
  failedTitle: "Payment did not go through",
  failedBody: "You can try again, or choose another pass.",
  expiredBody: "The payment request expired before it was approved.",
  cancelledBody: "The payment was cancelled.",
  tryAgain: "Try again",
  choosePass: "Choose another pass",
  timeoutTitle: "Still waiting for confirmation",
  timeoutBody: "If money left your account, show this reference to staff.",
  reference: "Reference",
  copy: "Copy",
  copied: "Copied",
  checkAgain: "Check again",
  mockTitle: "Test mode: act as the customer",
  mockApprove: "Approve payment",
  mockDecline: "Decline payment",
  mockUnavailable: "Test payments are turned off on this server.",
  paidTitle: "Payment received",
  voucherAcceptedTitle: "Voucher accepted",
  activeUntil: "Active until",
  timeLeft: (h: number, m: number) => (h > 0 ? `${h} h ${m} min left` : `${m} min left`),
  connecting: "Connecting your phone",
  onlineTitle: "You're online",
  onlineBody: "Your pass is running.",
  startBrowsing: "Start browsing",
  notConfigured: "Your pass is active, but this Wi-Fi can't connect you automatically yet. Ask staff for help.",
  noDeviceInfo: "Your pass is active. To use it, join the Wi-Fi network at the venue and open any website.",
  connectError: "We couldn't connect your phone.",
  voucherTitle: "Redeem a voucher",
  voucherCode: "Voucher code",
  voucherCodeHint: "Printed on the voucher you bought from staff.",
  voucherCodeInvalid: "Enter the voucher code.",
  voucherPhone: "Your phone number",
  voucherPhoneHint: "Linked to your pass so staff can find it.",
  redeem: "Redeem voucher",
  redeeming: "Checking voucher",
  needHelp: "Need help? Call",
  poweredBy: "Powered by Zubix WiFi",
  notFoundTitle: "Page not found",
  backHome: "Back to passes",
  unit: (unit: string, n: number) => {
    const names: Record<string, [string, string]> = {
      MINUTE: ["minute", "minutes"],
      HOUR: ["hour", "hours"],
      DAY: ["day", "days"],
      WEEK: ["week", "weeks"],
      MONTH: ["month", "months"],
    };
    const pair = names[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
    return n === 1 ? pair[0] : pair[1];
  },
};

export type Messages = typeof en;

const sw: Messages = {
  tagline: "Wi-Fi kwa saa, siku au wiki",
  headline: "Chagua kifurushi. Lipa kwa simu.",
  subhead: "Lipa kwa pesa ya simu na muda wako unaanza malipo yakithibitishwa.",
  fact1: "Lipa kwa pesa ya simu",
  fact2: "Hakuna akaunti wala nenosiri",
  fact3: "Muda unaanza malipo yakithibitishwa",
  language: "Lugha",
  wifiNetwork: (name: string) => `Wi-Fi: ${name}`,
  tabBuy: "Nunua kifurushi",
  tabVoucher: "Tumia vocha",
  loading: "Inapakia",
  passesError: "Hatukuweza kupakia vifurushi. Hakikisha umeunganishwa na Wi-Fi kisha jaribu tena.",
  retry: "Jaribu tena",
  noPassesTitle: "Hakuna vifurushi vinavyouzwa kwa sasa",
  noPassesBody: "Muulize mhudumu vocha, kisha tumia kichupo cha Tumia vocha.",
  bestValue: "Thamani zaidi",
  unlimitedData: "Data bila kikomo",
  dataLimit: (mb: number) => (mb >= 1024 ? `Data ya GB ${Number((mb / 1024).toFixed(1))}` : `Data ya MB ${mb}`),
  speedUpTo: (kbps: number) => `Hadi ${kbps >= 1000 ? Number((kbps / 1000).toFixed(1)) + " Mbps" : kbps + " kbps"}`,
  devices: (n: number) => (n === 1 ? "Kifaa 1" : `Vifaa ${n}`),
  buy: "Nunua",
  buyFor: (price: string) => `Nunua kwa ${price}`,
  back: "Rudi",
  yourPass: "Kifurushi chako",
  phoneLabel: "Namba ya pesa ya simu",
  phoneHint: "Tutatuma ombi la malipo kwa namba hii.",
  phoneInvalid: "Weka namba sahihi ya simu ya Tanzania, mfano 0712 345 678.",
  payWith: "Lipa kwa",
  providerMobile: "Pesa ya simu",
  providerMock: "Malipo ya majaribio (hakuna pesa halisi)",
  testBanner: "Hali ya majaribio. Hakuna pesa halisi inayotumika.",
  pay: (price: string) => `Lipa ${price}`,
  paying: "Inatuma ombi",
  noProviders: "Malipo hayapatikani kwa sasa. Muulize mhudumu akupe vocha.",
  passUnavailable: "Kifurushi hiki hakiuzwi tena.",
  pendingTitle: "Idhinisha malipo kwenye simu yako",
  yourPhone: "simu yako",
  step1: (phone: string) => `Angalia ujumbe wa pesa ya simu kwenye ${phone}.`,
  step2: (amount: string) => `Weka PIN yako ili kulipa ${amount}.`,
  autoUpdate: "Ukurasa huu unajisasisha wenyewe malipo yakithibitishwa.",
  slowHint: "Hakuna ujumbe bado? Hakikisha namba ni sahihi na ina salio la kutosha, kisha anza upya.",
  startOver: "Anza upya",
  failedTitle: "Malipo hayakukamilika",
  failedBody: "Unaweza kujaribu tena, au kuchagua kifurushi kingine.",
  expiredBody: "Ombi la malipo limeisha muda kabla ya kuidhinishwa.",
  cancelledBody: "Malipo yamefutwa.",
  tryAgain: "Jaribu tena",
  choosePass: "Chagua kifurushi kingine",
  timeoutTitle: "Bado tunasubiri uthibitisho",
  timeoutBody: "Kama pesa imetoka kwenye akaunti yako, mwonyeshe mhudumu namba hii ya kumbukumbu.",
  reference: "Namba ya kumbukumbu",
  copy: "Nakili",
  copied: "Imenakiliwa",
  checkAgain: "Angalia tena",
  mockTitle: "Hali ya majaribio: fanya kama mteja",
  mockApprove: "Idhinisha malipo",
  mockDecline: "Kataa malipo",
  mockUnavailable: "Malipo ya majaribio yamezimwa kwenye seva hii.",
  paidTitle: "Malipo yamepokelewa",
  voucherAcceptedTitle: "Vocha imekubaliwa",
  activeUntil: "Inatumika hadi",
  timeLeft: (h: number, m: number) => (h > 0 ? `Zimebaki saa ${h} dakika ${m}` : `Zimebaki dakika ${m}`),
  connecting: "Inaunganisha simu yako",
  onlineTitle: "Umeunganishwa",
  onlineBody: "Kifurushi chako kinatumika.",
  startBrowsing: "Anza kuvinjari",
  notConfigured: "Kifurushi chako kinatumika, lakini Wi-Fi hii bado haiwezi kukuunganisha kiotomatiki. Muulize mhudumu akusaidie.",
  noDeviceInfo: "Kifurushi chako kinatumika. Ili ukitumie, unganisha kwenye Wi-Fi ya hapa kisha fungua tovuti yoyote.",
  connectError: "Hatukuweza kuunganisha simu yako.",
  voucherTitle: "Tumia vocha",
  voucherCode: "Namba ya vocha",
  voucherCodeHint: "Imechapishwa kwenye vocha uliyonunua kwa mhudumu.",
  voucherCodeInvalid: "Weka namba ya vocha.",
  voucherPhone: "Namba yako ya simu",
  voucherPhoneHint: "Inaunganishwa na kifurushi chako ili mhudumu aweze kukipata.",
  redeem: "Tumia vocha",
  redeeming: "Inakagua vocha",
  needHelp: "Unahitaji msaada? Piga",
  poweredBy: "Imeundwa na Zubix WiFi",
  notFoundTitle: "Ukurasa haupatikani",
  backHome: "Rudi kwenye vifurushi",
  unit: (unit: string, n: number) => {
    const names: Record<string, [string, string]> = {
      MINUTE: ["dakika", "dakika"],
      HOUR: ["saa", "saa"],
      DAY: ["siku", "siku"],
      WEEK: ["wiki", "wiki"],
      MONTH: ["mwezi", "miezi"],
    };
    const pair = names[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
    return n === 1 ? pair[0] : pair[1];
  },
};

const dictionaries: Record<Lang, Messages> = { en, sw };
const PREF_KEY = "zubix.lang";

interface I18nValue {
  lang: Lang;
  t: Messages;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLang(): Lang {
  const saved = readPref(PREF_KEY);
  if (saved === "en" || saved === "sw") return saved;
  return "sw";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writePref(PREF_KEY, next);
  }, []);

  const value = useMemo<I18nValue>(() => ({ lang, t: dictionaries[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
