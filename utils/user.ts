// utils/user.ts

/**
 * E-posta adresini profesyonel bir şekilde maskeler.
 * Örnek: yakupdelil@gmail.com -> yak***@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  
  if (name.length <= 3) {
    return `${name}***@${domain}`;
  }
  return `${name.slice(0, 3)}***@${domain}`;
}

/**
 * Kullanıcının Ad Soyad bilgisinden profil avatarı için baş harfleri üretir.
 * Örnek: "Yakup Delil" -> "YD", "Ahmet" -> "AH"
 */
export function getInitials(fullName: string): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}