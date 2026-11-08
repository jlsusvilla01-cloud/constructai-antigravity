import type { Metadata } from "next";
import { createProject } from "@/app/actions/data";
import { ProjectForm } from "@/components/project-form";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New project" back={{ href: "/projects", label: "Projects" }} />
      <ProjectForm action={createProject} cancelHref="/projects" />
    </div>
  );
}
