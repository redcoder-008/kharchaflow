/**
 * UserAvatar
 * - Shows profile photo if user.photoURL is available
 * - Falls back to initials: first letter of first name + first letter of last name
 * - Falls back to "KF" if no display name
 *
 * Props:
 *   user       – the auth user object
 *   size       – tailwind size string, e.g. "w-7 h-7" (default) or "w-10 h-10"
 *   textSize   – tailwind text size, e.g. "text-xs" (default) or "text-sm"
 */
export default function UserAvatar({ user, size = "w-7 h-7", textSize = "text-xs" }) {
  const getInitials = () => {
    if (!user?.displayName) return "KF";
    const parts = user.displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || "User"}
        className={`${size} rounded-full object-cover border border-zinc-700 shrink-0`}
        onError={(e) => {
          // If image fails to load, hide it and show initials fallback
          e.target.style.display = "none";
          e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
        }}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-emerald-400 ${textSize} tracking-wide shrink-0`}
    >
      {getInitials()}
    </div>
  );
}
