import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProjectSummary } from "@/types/content";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <article className="group reveal">
      <Link href={`/projeler/${project.slug}/`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-line bg-surface-2">
          {project.cover ? (
            <Image
              src={project.cover.src}
              alt={project.cover.alt}
              fill
              sizes="(min-width: 1024px) 620px, 100vw"
              className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.02]"
            />
          ) : null}
        </div>
        <div className="mt-5 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm text-ink-soft">
              {project.sector} · {project.services.join(", ")}
            </p>
            <h3 className="mt-2 text-h3 group-hover:text-brand">{project.clientName}</h3>
            <p className="mt-2 text-ink-muted">{project.summary}</p>
          </div>
          <ArrowUpRight aria-hidden className="mt-1 size-5 shrink-0 text-ink-soft transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
        </div>
      </Link>
    </article>
  );
}
