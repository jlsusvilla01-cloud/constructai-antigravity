import type { Metadata } from "next";
import { headers } from "next/headers";
import { changeRole, createInvitation, removeMember, renameCompany, revokeInvitation, switchOrg } from "@/app/actions/team";
import { CopyButton } from "@/components/copy-button";
import { ActionForm, DeleteButton, SubmitButton } from "@/components/forms";
import { Badge, Card, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { getSession } from "@/lib/org";
import type { Role } from "@/lib/types";

export const metadata: Metadata = { title: "Company & team" };

type Member = { user_id: string; email: string; full_name: string | null; role: Role; joined_at: string };
type Invitation = { id: string; email: string; role: Role; token: string; created_at: string };

const ROLE_LABEL: Record<Role, string> = { owner: "Owner", member: "Staff" };

export default async function SettingsPage() {
  const { supabase, orgId, orgName, isOwner, user, orgs } = await getSession();

  const [{ data: memberRows }, { data: inviteRows }] = await Promise.all([
    supabase.rpc("org_members", { target_org: orgId }),
    isOwner
      ? supabase.from("invitations").select("id, email, role, token, created_at").eq("org_id", orgId).is("accepted_at", null).order("created_at")
      : Promise.resolve({ data: [] }),
  ]);
  const members = (memberRows ?? []) as Member[];
  const invites = (inviteRows ?? []) as Invitation[];
  const ownerCount = members.filter((m) => m.role === "owner").length;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  const base = `${proto}://${host}`;

  return (
    <>
      <PageHeader title="Company & team" sub={`${orgName} · you are ${isOwner ? "an owner" : "staff"}`} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader
              title="Team"
              sub="Owners can do everything. Staff can view and add records, but can’t delete anything or manage the team."
            />
            <ul className="divide-y divide-line">
              {members.map((m) => {
                const me = m.user_id === user.id;
                const lastOwner = m.role === "owner" && ownerCount === 1;
                return (
                  <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {m.full_name || m.email} {me && <span className="font-normal text-muted">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {m.full_name ? `${m.email} · ` : ""}joined {fmtDate(m.joined_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge tone={m.role === "owner" ? "brand" : "neutral"}>{ROLE_LABEL[m.role]}</Badge>
                      {isOwner && !lastOwner && (
                        <ActionForm action={changeRole.bind(null, m.user_id, m.role === "owner" ? "member" : "owner")} resetOnSuccess={false}>
                          <button className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink">
                            {m.role === "owner" ? "Make staff" : "Make owner"}
                          </button>
                        </ActionForm>
                      )}
                      {((isOwner && !me) || (me && !lastOwner && orgs.length > 1)) && (
                        <ActionForm action={removeMember.bind(null, m.user_id)} resetOnSuccess={false}>
                          <button className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-loss-soft hover:text-loss">
                            {me ? "Leave" : "Remove"}
                          </button>
                        </ActionForm>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {isOwner && (
            <Card>
              <CardHeader
                title="Invite someone"
                sub="You’ll get a link to send by Viber, Messenger or SMS. They sign up with that email and join your company."
              />
              <div className="p-4 sm:p-5">
                <ActionForm action={createInvitation}>
                  <div className="grid gap-3 sm:grid-cols-6">
                    <Field label="Email" className="sm:col-span-4">
                      <Input name="email" type="email" placeholder="engineer@example.com" required />
                    </Field>
                    <Field label="Role" className="sm:col-span-2">
                      <Select name="role" defaultValue="member">
                        <option value="member">Staff</option>
                        <option value="owner">Owner</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <SubmitButton>Create invitation link</SubmitButton>
                  </div>
                </ActionForm>
              </div>
              {invites.length > 0 && (
                <div className="border-t border-line">
                  <p className="px-4 pt-3 text-xs font-medium text-muted sm:px-5">Waiting to join</p>
                  <ul className="divide-y divide-line">
                    {invites.map((i) => {
                      const link = `${base}/invite/${i.token}`;
                      return (
                        <li key={i.id} className="px-4 py-3 sm:px-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm text-ink">
                              {i.email} <span className="text-muted">· {ROLE_LABEL[i.role]} · invited {fmtDate(i.created_at)}</span>
                            </p>
                            <div className="flex items-center gap-1">
                              <CopyButton text={link} />
                              <DeleteButton action={revokeInvitation.bind(null, i.id)} label="Cancel" confirmText="Cancel this invitation? The link will stop working." />
                            </div>
                          </div>
                          <p className="mt-1 truncate font-mono text-xs text-faint" title={link}>
                            {link}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Company" />
            <div className="p-4 sm:p-5">
              {isOwner ? (
                <ActionForm action={renameCompany} resetOnSuccess={false}>
                  <Field label="Company name">
                    <Input name="name" defaultValue={orgName} required />
                  </Field>
                  <div className="mt-3 flex justify-end">
                    <SubmitButton variant="secondary">Save</SubmitButton>
                  </div>
                </ActionForm>
              ) : (
                <p className="text-sm text-ink">{orgName}</p>
              )}
            </div>
          </Card>

          {orgs.length > 1 && (
            <Card>
              <CardHeader title="Your companies" sub="You belong to more than one. Switch to work in another." />
              <ul className="divide-y divide-line">
                {orgs.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <span className="min-w-0 truncate text-sm text-ink">
                      {o.name} <span className="text-muted">· {ROLE_LABEL[o.role]}</span>
                    </span>
                    {o.id === orgId ? (
                      <Badge tone="gain">Current</Badge>
                    ) : (
                      <form action={switchOrg.bind(null, o.id)}>
                        <button className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft">Switch</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

        </div>
      </div>
    </>
  );
}
