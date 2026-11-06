"use client";

import { SelectField, TagsField, TextAreaField } from "@/components/admin/fields";
import { SaveForm } from "@/components/admin/SaveForm";
import { QUOTE_STATUSES, QUOTE_STATUS_LABEL } from "@/lib/crm";
import { addQuoteNote, updateLead, updateQuoteMeta, updateQuoteStatus } from "@/server/actions/crm";

export function QuoteStatusForm({ csrf, id, status }: { csrf: string; id: string; status: string }) {
  return (
    <SaveForm action={updateQuoteStatus} csrf={csrf} inline submitLabel="Durumu güncelle" key={status}>
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4">
        <SelectField name="status" label="Durum" options={QUOTE_STATUSES.map((s) => ({ value: s, label: QUOTE_STATUS_LABEL[s] }))} defaultValue={status} />
        <TextAreaField name="note" label="Not" hint="Kazanıldı / kaybedildi için zorunlu." rows={2} optional />
      </div>
    </SaveForm>
  );
}

export function QuoteNoteForm({ csrf, id }: { csrf: string; id: string }) {
  return (
    <SaveForm action={addQuoteNote} csrf={csrf} inline submitLabel="Ekle">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <SelectField
          name="kind"
          label="Tür"
          options={[
            { value: "note", label: "Not" },
            { value: "call", label: "Telefon görüşmesi" },
            { value: "email", label: "E-posta" },
            { value: "meeting", label: "Toplantı" },
          ]}
          defaultValue="note"
        />
        <TextAreaField name="body" label="İçerik" rows={3} />
      </div>
    </SaveForm>
  );
}

export function QuoteMetaForm({ csrf, id, assignedToId, tags, assignees }: { csrf: string; id: string; assignedToId: string | null; tags: string[]; assignees: { id: string; name: string }[] }) {
  return (
    <SaveForm action={updateQuoteMeta} csrf={csrf} inline>
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4">
        <SelectField name="assignedToId" label="Sorumlu" options={[{ value: "", label: "Atanmamış" }, ...assignees.map((a) => ({ value: a.id, label: a.name }))]} defaultValue={assignedToId ?? ""} />
        <TagsField name="tags" label="Etiketler" initial={tags} hint="Örn. acil, kurumsal, tekrar-müşteri" />
      </div>
    </SaveForm>
  );
}

export function LeadForm({ csrf, id, status, assignedToId, adminNote, assignees }: { csrf: string; id: string; status: string; assignedToId: string | null; adminNote: string | null; assignees: { id: string; name: string }[] }) {
  return (
    <SaveForm action={updateLead} csrf={csrf} inline>
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4">
        <SelectField
          name="status"
          label="Durum"
          options={[
            { value: "new", label: "Yeni" },
            { value: "contacted", label: "İletişime geçildi" },
            { value: "closed", label: "Kapandı" },
            { value: "spam", label: "Spam" },
          ]}
          defaultValue={status}
        />
        <SelectField name="assignedToId" label="Sorumlu" options={[{ value: "", label: "Atanmamış" }, ...assignees.map((a) => ({ value: a.id, label: a.name }))]} defaultValue={assignedToId ?? ""} />
        <TextAreaField name="adminNote" label="İç not" rows={4} defaultValue={adminNote ?? ""} optional />
      </div>
    </SaveForm>
  );
}
