import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { BottomNav, SideNav } from "@/components/nav";
import { getSession } from "@/lib/org";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, orgName } = await getSession();
  const name = (user.user_metadata?.full_name as string | undefined) || user.email;

  return (
    <div className="min-h-dvh lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Logo />
          <p className="mt-3 truncate text-xs font-medium text-muted" title={orgName}>
            {orgName}
          </p>
        </div>
        <div className="flex-1 px-3">
          <SideNav />
        </div>
        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-sm font-medium text-ink" title={name ?? ""}>
            {name}
          </p>
          <form action={logout}>
            <button type="submit" className="mt-1 text-xs text-muted hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Logo compact />
          <span className="truncate text-sm font-semibold text-ink">{orgName}</span>
        </div>
        <form action={logout}>
          <button type="submit" className="text-xs text-muted hover:text-ink">
            Log out
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      <BottomNav />
    </div>
  );
}
