import { PROJECT_STATUSES } from "@/lib/constants";
import type { ActionState, Project } from "@/lib/types";
import { ActionForm, SubmitButton } from "./forms";
import { Card, Field, Input, LinkButton, Select, Textarea } from "./ui";

export function ProjectForm({
  action,
  project,
  cancelHref,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  project?: Project;
  cancelHref: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <ActionForm action={action} resetOnSuccess={false}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name" className="sm:col-span-2">
            <Input name="name" defaultValue={project?.name} placeholder="Santos Residence" required />
          </Field>
          <Field label="Client">
            <Input name="client_name" defaultValue={project?.client_name ?? ""} placeholder="Maria Santos" />
          </Field>
          <Field label="Location">
            <Input name="location" defaultValue={project?.location ?? ""} placeholder="BGC, Taguig" />
          </Field>
          <Field label="Contract amount (₱)" hint="The original contract price agreed with the client.">
            <Input
              name="contract_amount"
              inputMode="decimal"
              defaultValue={project ? String(project.contract_amount) : ""}
              placeholder="4,250,000"
              required
            />
          </Field>
          <Field label="Cost budget (₱)" hint="What you expect the job to cost you. Used to project profit.">
            <Input
              name="budget"
              inputMode="decimal"
              defaultValue={project ? String(project.budget) : ""}
              placeholder="3,650,000"
            />
          </Field>
          <Field label="Retention (%)" hint="Withheld by the client from each progress billing. Usually 10%.">
            <Input
              name="retention_pct"
              inputMode="decimal"
              defaultValue={project ? String(project.retention_pct) : "10"}
              placeholder="10"
            />
          </Field>
          <Field label="Downpayment (%)" hint="Advance billed up front and recouped from progress billings. 0 if none.">
            <Input
              name="downpayment_pct"
              inputMode="decimal"
              defaultValue={project ? String(project.downpayment_pct) : "0"}
              placeholder="15"
            />
          </Field>
          <Field label="Start date">
            <Input name="start_date" type="date" defaultValue={project?.start_date ?? ""} />
          </Field>
          <Field label="Target completion">
            <Input name="end_date" type="date" defaultValue={project?.end_date ?? ""} />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={project?.status ?? "active"}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea name="notes" rows={3} defaultValue={project?.notes ?? ""} />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <LinkButton href={cancelHref} variant="secondary">
            Cancel
          </LinkButton>
          <SubmitButton>{project ? "Save changes" : "Create project"}</SubmitButton>
        </div>
      </ActionForm>
    </Card>
  );
}
