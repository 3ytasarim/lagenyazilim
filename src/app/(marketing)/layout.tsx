import type { Metadata } from "next";
import { ConsentAndAnalytics } from "@/components/layout/ConsentAndAnalytics";
import { AnnouncementPopup } from "@/components/layout/AnnouncementPopup";
import { FloatingRail } from "@/components/layout/FloatingRail";
import { InductionButtons } from "@/components/ui/induction-button";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StickyCta } from "@/components/layout/StickyCta";
import { buildNav } from "@/components/layout/nav";
import { JsonLd } from "@/components/seo/JsonLd";
import { graph, organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { getPublicSetting } from "@/lib/settings";
import { QuoteModal } from "@/components/forms/QuoteModal";
import { QUOTE_LOCATIONS } from "@/content/provinces";
import { getActivePopup, getBusiness, getCities, getFeaturedProjects, getLatestPosts, getQuoteOptions, getServices } from "@/server/queries/content";

/** Search Console / Bing doğrulama kodları Site ayarları'ndan. */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublicSetting("seo").catch(() => null);
  return {
    verification: {
      ...(seo?.googleSiteVerification ? { google: seo.googleSiteVerification } : {}),
      ...(seo?.bingSiteVerification ? { other: { "msvalidate.01": seo.bingSiteVerification } } : {}),
    },
  };
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [business, services, cities, projects, posts, analytics, quote, popup] = await Promise.all([
    getBusiness(),
    getServices(),
    getCities(),
    getFeaturedProjects(1),
    getLatestPosts(1),
    getPublicSetting("analytics").catch(() => ({ provider: "none" as const, ga4Id: "", umamiUrl: "", umamiSiteId: "" })),
    getQuoteOptions(),
    getActivePopup().catch(() => null),
  ]);
  const nav = buildNav({ hasProjects: projects.length > 0, hasPosts: posts.length > 0 });
  const navServices = services.map((s) => ({ href: `/${s.slug}/`, name: s.name, summary: s.summary, icon: s.icon }));

  return (
    <>
      <div aria-hidden className="scroll-progress" />
      <a
        href="#icerik"
        className="fixed top-3 left-3 z-[60] -translate-y-24 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand transition-transform focus:translate-y-0"
      >
        İçeriğe geç
      </a>
      <SiteHeader
        nav={nav}
        services={navServices}
        phone={business.phone}
        phoneE164={business.phoneE164}
        whatsappE164={business.whatsappE164}
      />
      <main id="icerik" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter business={business} services={services} cities={cities} nav={nav} />
      <FloatingRail phoneE164={business.phoneE164} whatsappE164={business.whatsappE164} />
      <StickyCta phoneE164={business.phoneE164} whatsappE164={business.whatsappE164} />
      <div aria-hidden className="h-[72px] md:hidden" />
      <QuoteModal options={quote.services} budgets={quote.budgets} locations={QUOTE_LOCATIONS} />
      <AnnouncementPopup popup={popup} />
      <RevealObserver />
      <InductionButtons />
      <ConsentAndAnalytics config={analytics} />
      <JsonLd data={graph(organizationSchema(business), websiteSchema())} />
    </>
  );
}
