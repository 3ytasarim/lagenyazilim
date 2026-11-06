import { Gauge, LayoutDashboard, MapPin, Users } from "lucide-react";

/** Güven şeridi: rakam iddiası yerine doğrulanabilir çalışma biçimi bilgileri. */
const ITEMS = [
  { icon: MapPin, title: "Türkiye geneli", text: "Her ilden çevrim içi süreç, Ankara'da ofis" },
  { icon: Users, title: "Tek ekip", text: "Tasarım, yazılım ve SEO aynı planla" },
  { icon: LayoutDashboard, title: "Yönetim paneli", text: "İçeriğinizi kendiniz güncelleyin" },
  { icon: Gauge, title: "Hız ve erişilebilirlik", text: "Başlangıçtan mimarinin parçası" },
];

export function CapabilityStrip() {
  return (
    <section aria-label="Çalışma biçimimiz" className="relative isolate overflow-hidden">
      <ul className="container-site grid gap-4 py-12 sm:grid-cols-2 lg:grid-cols-4 md:py-16">
        {ITEMS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="reveal" data-reveal="blur" style={{ "--d": i } as React.CSSProperties}>
            <div className="spotlight group relative h-full overflow-hidden rounded-[22px] border border-line bg-surface p-6 transition-[transform,border-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:border-brand/50 hover:shadow-float">
              {/* Köşe ışığı */}
              <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-brand/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-60" />
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-cyan text-white shadow-[0_10px_30px_-10px] shadow-brand/60 transition-transform duration-500 ease-out-expo group-hover:scale-110 group-hover:-rotate-6">
                <Icon aria-hidden strokeWidth={1.9} className="size-6" />
              </span>
              <p className="relative mt-6 font-display text-lg font-semibold tracking-tight">{title}</p>
              <p className="relative mt-1.5 text-[0.9375rem] text-ink-muted">{text}</p>
              <span aria-hidden className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-brand to-brand-cyan transition-transform duration-700 ease-out-expo group-hover:scale-x-100" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
