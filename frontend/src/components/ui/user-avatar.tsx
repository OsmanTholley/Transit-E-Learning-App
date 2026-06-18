import Image from "next/image";
import { normalizeUploadUrl } from "@/lib/normalize-upload-url";

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
  // Convert legacy /api/upload/file?name=... URLs → /uploads/... (no query string)
  const imgSrc = normalizeUploadUrl(profileImage);

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0B3D91] to-blue-700 ${dim} ${ringClass} ${className}`}
    >
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt={fullName}
          fill
          className="object-cover"
          sizes={size === "xl" ? "208px" : size === "lg" ? "96px" : "40px"}
          unoptimized={imgSrc.startsWith("https://")}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold text-white">
          {initials}
        </span>
      )}
    </div>
  );
}
