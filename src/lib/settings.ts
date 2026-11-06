import "server-only";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { DEFAULT_BUSINESS, type BusinessInfo } from "@/lib/site";

export type SmtpSettings = {
  host: string;
  port: number;
  secure: "ssl" | "starttls" | "none";
  user: string;
  /** seal() ile şifrelenmiş parola */
  passSealed: string;
  from: string;
  notifyTo: string;
  sendCustomerReceipt: boolean;
};

export type SeoSettings = { googleSiteVerification: string; bingSiteVerification: string; gbpUrl: string };
export type AnalyticsSettings = { provider: "none" | "ga4" | "umami"; ga4Id: string; umamiUrl: string; umamiSiteId: string };

type SettingMap = { business: BusinessInfo; smtp: SmtpSettings; seo: SeoSettings; analytics: AnalyticsSettings };

const DEFAULTS: { [K in keyof SettingMap]: SettingMap[K] } = {
  business: DEFAULT_BUSINESS,
  smtp: { host: "", port: 587, secure: "starttls", user: "", passSealed: "", from: "", notifyTo: "", sendCustomerReceipt: true },
  seo: { googleSiteVerification: "", bingSiteVerification: "", gbpUrl: "" },
  analytics: { provider: "none", ga4Id: "", umamiUrl: "", umamiSiteId: "" },
};

export const SETTINGS_TAG = "settings";

async function read<K extends keyof SettingMap>(key: K): Promise<SettingMap[K]> {
  const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return { ...DEFAULTS[key], ...((row?.value as Partial<SettingMap[K]>) ?? {}) };
}

/** Public sayfalar için önbellekli okuma (SMTP hariç — gizli değer önbelleğe alınmaz). */
export const getPublicSetting = <K extends Exclude<keyof SettingMap, "smtp">>(key: K) =>
  unstable_cache(() => read(key), ["setting", key], { tags: [SETTINGS_TAG], revalidate: 3600 })();

export const getSettingUncached = read;
