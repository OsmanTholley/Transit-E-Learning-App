// Use a plain <img> tag for profile photos — the src is a dynamic local API path
// (/api/upload/file?name=...) which is incompatible with Next.js <Image> query-string
// restrictions. A plain img tag works identically here with no config overhead.

const sizeClasses = {
  sm: "h-9 w-9 text-xs rounded-full",
  md: "h-10 w-10 text-sm rounded-full",
  lg: "h-24 w-24 text-2xl rounded-2xl",
  xl: "h-52 w-52 text-4xl rounded-full",
} as const;

type Props = {
  fullName: string;
  profileImage?: string | null;
  initials: string;
  size?: keyof typeof sizeClasses;
  className?: string;
  ring?: boolean;
};

export function UserAvatar({
  fullName,
  profileImage,
  initials,
  size = "md",
  className = "",
  ring = false,
}: Props) {
  const dim = sizeClasses[size];
  const ringClass = ring ? "ring-4 ring-white shadow-lg" : "";

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0B3D91] to-blue-700 ${dim} ${ringClass} ${className}`}
    >
      {profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileImage}
          alt={fullName}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold text-white">
          {initials}
        </span>
      )}
    </div>
  );
}
