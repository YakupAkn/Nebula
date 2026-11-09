import type { SupabaseClient } from "@supabase/supabase-js";

export interface Recipient {
  id: string;
  email: string;
  fullName: string | null;
  betaTester: boolean;
}

const PAGE = 1000;
const MAX_PAGES = 50;

/**
 * E-posta almayı kabul etmiş (profiles.marketing_consent = true) kullanıcılar.
 * Onayı olmayan kimseye duyuru gitmez. E-posta adresleri auth.users'tan gelir.
 */
export async function listConsentedRecipients(db: SupabaseClient): Promise<Recipient[]> {
  const profiles: { id: string; full_name: string | null; beta_tester: boolean }[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await db
      .from("profiles")
      .select("id, full_name, beta_tester")
      .eq("marketing_consent", true)
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;
    profiles.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  if (profiles.length === 0) return [];

  const emails = new Map<string, string>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: PAGE });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email) emails.set(u.id, u.email);
    }
    if (data.users.length < PAGE) break;
  }

  return profiles
    .filter((p) => emails.has(p.id))
    .map((p) => ({
      id: p.id,
      email: emails.get(p.id)!,
      fullName: p.full_name,
      betaTester: p.beta_tester === true,
    }));
}
