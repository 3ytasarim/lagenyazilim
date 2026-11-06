import "server-only";
import { absoluteUrl } from "@/lib/site";

/* Bildirim şablonları: düz metin + sade HTML. Kullanıcı girdisi HTML'e kaçışlanarak yazılır. */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(title: string, rows: [string, string][], footer?: string) {
  const body = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#6b7088;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#0e1530;white-space:pre-line">${esc(v)}</td></tr>`)
    .join("");
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f6f5f1;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:32px 20px"><p style="margin:0 0 4px;color:#1a3fb5;font-weight:700">Lagen Yazılım</p><h1 style="margin:0 0 20px;font-size:20px;color:#0e1530">${esc(title)}</h1><table style="width:100%;border-collapse:collapse;font-size:14px;background:#fff;border:1px solid #dcdad2;border-radius:8px;padding:12px">${body}</table>${footer ? `<p style="margin:20px 0 0;font-size:13px;color:#4a5068">${footer}</p>` : ""}</div></body></html>`;
}

const text = (title: string, rows: [string, string][], footer?: string) =>
  [title, "", ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), ...(footer ? ["", footer.replace(/<[^>]+>/g, "")] : [])].join("\n");

export type QuoteMail = {
  id: string;
  number: string;
  services: string;
  contactName: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  preferredContact: string;
  needs: string;
  budget: string;
  startTiming: string;
  attachments: number;
};

export function quoteAdminMail(q: QuoteMail) {
  const title = `Yeni teklif talebi ${q.number}`;
  const link = absoluteUrl(`/admin/teklifler/${q.id}/`);
  const rows: [string, string][] = [
    ["Hizmetler", q.services],
    ["Ad soyad", q.contactName],
    ["Firma", q.company],
    ["E-posta", q.email],
    ["Telefon", q.phone],
    ["Konum", q.location],
    ["Tercih", q.preferredContact],
    ["Bütçe", q.budget],
    ["Başlangıç", q.startTiming],
    ["Ekler", q.attachments ? `${q.attachments} dosya (panelden indirilebilir)` : ""],
    ["İhtiyaç", q.needs.slice(0, 1500)],
  ];
  return { subject: `${title} — ${q.contactName}`, text: text(title, rows, `Ayrıntılar: ${link}`), html: layout(title, rows, `<a href="${esc(link)}">Talebi yönetim panelinde açın</a>`) };
}

export function quoteReceiptMail(q: QuoteMail, business: { name: string; phone: string; email: string }) {
  const title = "Teklif talebiniz bize ulaştı";
  const rows: [string, string][] = [
    ["Talep numarası", q.number],
    ["Hizmetler", q.services],
  ];
  const footer = `Talebinizi inceleyip tercih ettiğiniz yöntemle size dönüş yapacağız. Sorunuz olursa ${business.phone} veya ${business.email} üzerinden bize ulaşabilirsiniz. Bu e-posta otomatik gönderilmiştir.`;
  return { subject: `${business.name} — talebiniz alındı (${q.number})`, text: text(`Merhaba ${q.contactName},\n\n${title}.`, rows, footer), html: layout(title, rows, esc(footer)) };
}

export type LeadMail = { id: string; source: "contact" | "seo_audit"; name: string; email: string; phone: string; company: string; website: string; goal: string; subject: string; message: string };

export function leadAdminMail(l: LeadMail) {
  const title = l.source === "seo_audit" ? "Yeni ücretsiz SEO analizi talebi" : "Yeni iletişim mesajı";
  const link = absoluteUrl(`/admin/basvurular/${l.id}/`);
  const rows: [string, string][] = [
    ["Ad soyad", l.name],
    ["Firma", l.company],
    ["E-posta", l.email],
    ["Telefon", l.phone],
    ["Web sitesi", l.website],
    ["Hedef", l.goal],
    ["Konu", l.subject],
    ["Mesaj", l.message.slice(0, 2000)],
  ];
  return { subject: `${title} — ${l.name}`, text: text(title, rows, `Ayrıntılar: ${link}`), html: layout(title, rows, `<a href="${esc(link)}">Başvuruyu yönetim panelinde açın</a>`) };
}
