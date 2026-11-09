import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteProject, updateProject } from "@/app/actions/data";
import { DeleteButton } from "@/components/forms";
import { ProjectForm } from "@/components/project-form";
import { Card, PageHeader } from "@/components/ui";
import { getSession } from "@/lib/org";
import type { Project } from "@/lib/types";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, isOwner } = await getSession();
  const { data } = await supabase.from("projects").select("*").eq("id", id).eq("org_id", orgId).maybeSingle();
  if (!data) notFound();
  const project = data as Project;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit project" back={{ href: `/projects/${id}`, label: project.name }} />
      <ProjectForm action={updateProject.bind(null, id)} project={project} cancelHref={`/projects/${id}`} />

      {isOwner && (
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm font-medium text-ink">Delete project</p>
          <p className="text-sm text-muted">Removes the project with all its costs, billings, payments, BOQ and purchase orders.</p>
        </div>
        <DeleteButton
          action={deleteProject.bind(null, id)}
          label="Delete project"
          confirmText={`Delete “${project.name}” and everything recorded under it? This can’t be undone.`}
          className="border border-line px-3 py-2 text-sm text-loss"
        />
      </Card>
      )}
    </div>
  );
}
