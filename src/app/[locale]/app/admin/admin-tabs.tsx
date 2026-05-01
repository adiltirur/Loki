"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as Tabs from "@radix-ui/react-tabs";
import { Plus, ChevronDown, ChevronRight, Mail, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/loki/avatar";
import { MemberRowSkeleton } from "@/components/loki/skeletons";
import { useTopbarConfig } from "@/components/loki/topbar-context";
import { cn } from "@/lib/utils";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberCount: number;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  githubLogin: string | null;
  role: string;
  createdAt: string;
  orgs: { name: string; slug: string; role: string }[];
}

interface MemberDetail {
  id: string;
  role: "admin" | "member";
  seats: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    githubLogin: string | null;
    role: string;
  };
}

interface AdminTabsProps {
  orgs: OrgRow[];
  users: UserRow[];
}

export function AdminTabs({ orgs, users }: AdminTabsProps) {
  const t = useTranslations("app.admin");
  const router = useRouter();
  const [tab, setTab] = useState("orgs");
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [inviteFor, setInviteFor] = useState<OrgRow | null>(null);

  useTopbarConfig({ breadcrumbs: [t("title")] });

  return (
    <div className="max-w-4xl">
      <h1 className="text-lg font-semibold mb-6">{t("title")}</h1>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="flex gap-1 mb-6 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
          {[
            { id: "orgs", label: t("tabsOrgs") },
            { id: "users", label: t("tabsUsers") },
          ].map((entry) => (
            <Tabs.Trigger
              key={entry.id}
              value={entry.id}
              className={cn(
                "px-3 py-2 text-sm transition-colors -mb-px focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2",
                tab === entry.id
                  ? "border-b-2 border-[var(--color-accent)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              {entry.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="orgs">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> {t("createOrg")}
            </Button>
          </div>
          {orgs.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">{t("noOrgs")}</p>
          ) : (
            <ul className="space-y-2">
              {orgs.map((o) => (
                <OrgEntry
                  key={o.id}
                  org={o}
                  expanded={expandedOrgId === o.id}
                  onToggle={() => setExpandedOrgId(expandedOrgId === o.id ? null : o.id)}
                  onInvite={() => setInviteFor(o)}
                  onChanged={() => router.refresh()}
                />
              ))}
            </ul>
          )}
        </Tabs.Content>

        <Tabs.Content value="users">
          {users.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">{t("noUsers")}</p>
          ) : (
            <ul className="space-y-1">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 rounded bg-[var(--color-card)] px-3 py-2.5"
                >
                  <Avatar src={u.image} name={u.name} email={u.email} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name ?? u.email}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                      {u.email}
                      {u.githubLogin ? ` · @${u.githubLogin}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] px-1.5 py-0.5 rounded font-medium",
                      u.role === "super_admin"
                        ? "bg-[var(--color-secondary-container)] text-[var(--color-secondary)]"
                        : "bg-[var(--color-surface-container-high)] text-[var(--color-muted-foreground)]"
                    )}
                  >
                    {u.role === "super_admin" ? t("rolesSuperAdmin") : t("rolesMember")}
                  </span>
                  <span className="text-xs text-[var(--color-muted-foreground)] hidden sm:inline">
                    {u.orgs.map((o) => o.name).join(", ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Content>
      </Tabs.Root>

      <CreateOrgDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />

      {inviteFor && (
        <InviteDialog
          org={inviteFor}
          open
          onOpenChange={(o) => !o && setInviteFor(null)}
          onInvited={() => {
            setInviteFor(null);
          }}
        />
      )}
    </div>
  );
}

function OrgEntry({
  org,
  expanded,
  onToggle,
  onInvite,
  onChanged,
}: {
  org: OrgRow;
  expanded: boolean;
  onToggle: () => void;
  onInvite: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations("app.admin");
  return (
    <li className="rounded bg-[var(--color-card)]">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-surface-container-high)] rounded transition-colors"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{org.name}</p>
          <p className="text-xs text-[var(--color-muted-foreground)] font-mono">{org.slug}</p>
        </div>
        <span className="text-xs text-[var(--color-muted-foreground)]">
          {org.memberCount === 1 ? t("memberCountOne") : t("memberCountOther", { count: org.memberCount })}
        </span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
          <div className="flex justify-end pt-2">
            <Button size="sm" variant="secondary" onClick={onInvite}>
              <Mail className="h-3.5 w-3.5" /> {t("invite")}
            </Button>
          </div>
          <MemberList orgId={org.id} onChanged={onChanged} />
        </div>
      )}
    </li>
  );
}

function MemberList({ orgId, onChanged }: { orgId: string; onChanged: () => void }) {
  const t = useTranslations("app.admin");
  const [members, setMembers] = useState<MemberDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orgs/${orgId}/members`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(t("loadFailed")))))
      .then((d) => {
        if (!cancelled) setMembers(d.members);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [orgId, t]);

  async function updateSeats(memberId: string, seats: number) {
    const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ seats }),
    });
    if (res.ok && members) {
      setMembers(members.map((m) => (m.id === memberId ? { ...m, seats } : m)));
    }
  }

  async function remove(memberId: string) {
    if (!confirm(t("removeMemberConfirm"))) return;
    const res = await fetch(`/api/orgs/${orgId}/members/${memberId}`, { method: "DELETE" });
    if (res.ok && members) {
      setMembers(members.filter((m) => m.id !== memberId));
      onChanged();
    }
  }

  if (error) {
    return <p className="text-xs text-[var(--color-destructive)] mt-2">{error}</p>;
  }
  if (!members) {
    return (
      <div className="mt-2 space-y-1">
        <MemberRowSkeleton />
        <MemberRowSkeleton />
      </div>
    );
  }
  if (members.length === 0) {
    return <p className="text-xs text-[var(--color-muted-foreground)] mt-2">{t("noMembers")}</p>;
  }
  return (
    <ul className="mt-2 space-y-1">
      {members.map((m) => (
        <li key={m.id} className="flex items-center gap-3 px-2 py-1.5">
          <Avatar src={m.user.image} name={m.user.name} email={m.user.email} size={24} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{m.user.name ?? m.user.email}</p>
            <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
              {m.user.email} · {m.role === "admin" ? t("roleAdmin") : t("roleMember")}
            </p>
          </div>
          <label className="flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
            {t("seatsLabel")}
            <input
              type="number"
              min={0}
              max={1000}
              defaultValue={m.seats}
              onBlur={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isFinite(v) && v !== m.seats) updateSeats(m.id, v);
              }}
              className="h-7 w-16 rounded bg-[var(--color-surface-container)] px-2 text-xs outline-none"
            />
          </label>
          <button
            onClick={() => remove(m.id)}
            className="rounded p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-surface-container-high)]"
            aria-label={t("removeMemberAria")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function CreateOrgDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const t = useTranslations("app.admin");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  async function submit() {
    if (!name.trim() || !slug.trim()) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t("createFailed"));
      return;
    }
    setName("");
    setSlug("");
    setTouched(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createOrgTitle")}</DialogTitle>
          <DialogDescription>{t("createOrgDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs text-[var(--color-muted-foreground)] mb-1">{t("nameLabel")}</span>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!touched) setSlug(autoSlug(e.target.value));
              }}
              placeholder={t("namePlaceholder")}
            />
          </label>
          <label className="block">
            <span className="block text-xs text-[var(--color-muted-foreground)] mb-1">{t("slugLabel")}</span>
            <Input
              mono
              value={slug}
              onChange={(e) => {
                setTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              placeholder={t("slugPlaceholder")}
            />
          </label>
          {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={pending || !name.trim() || !slug.trim()}>
            {pending ? t("creating") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({
  org,
  open,
  onOpenChange,
  onInvited,
}: {
  org: OrgRow;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onInvited: () => void;
}) {
  const t = useTranslations("app.admin");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim()) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/orgs/${org.id}/invites`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t("inviteFailed"));
      return;
    }
    setSent(true);
    setTimeout(() => {
      onInvited();
    }, 1200);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("inviteTitle", { org: org.name })}</DialogTitle>
          <DialogDescription>{t("inviteDescription")}</DialogDescription>
        </DialogHeader>
        {sent ? (
          <p className="text-sm text-[var(--color-success)]">{t("inviteSent", { email })}</p>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="block text-xs text-[var(--color-muted-foreground)] mb-1">{t("emailLabel")}</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-[var(--color-muted-foreground)] mb-1">{t("roleLabel")}</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "member")}
                className="h-9 w-full rounded-sm bg-[var(--color-surface-container-lowest)] px-3 text-sm outline-none"
              >
                <option value="member">{t("roleMember")}</option>
                <option value="admin">{t("roleAdmin")}</option>
              </select>
            </label>
            {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
          </div>
        )}
        {!sent && (
          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button onClick={submit} disabled={pending || !email.trim()}>
              {pending ? t("sending") : t("sendInvite")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
