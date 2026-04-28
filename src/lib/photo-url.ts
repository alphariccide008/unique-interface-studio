import { supabase } from "@/integrations/supabase/client";

export function photoUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  const { data } = supabase.storage.from("profile-photos").getPublicUrl(storagePath);
  return data.publicUrl;
}