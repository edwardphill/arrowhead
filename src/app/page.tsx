import CommunityMap from "@/components/CommunityMap";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function Home() {
  if (!isSupabaseConfigured) return null;
  return <CommunityMap />;
}
