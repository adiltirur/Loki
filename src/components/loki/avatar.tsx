import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}

function initials(name?: string | null, email?: string | null): string {
  const source = (name?.trim() || email?.trim() || "").trim();
  if (!source) return "?";
  if (source.includes("@")) return source[0]!.toUpperCase();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return source[0]!.toUpperCase();
}

export function Avatar({ src, name, email, size = 28, className }: AvatarProps) {
  const px = `${size}px`;
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? email ?? "avatar"}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] font-medium",
        className
      )}
      style={{ width: px, height: px, fontSize: Math.max(10, Math.round(size * 0.4)) }}
      aria-hidden="true"
    >
      {initials(name, email)}
    </div>
  );
}
