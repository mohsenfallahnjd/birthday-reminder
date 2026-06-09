import { cookies } from "next/headers";
import type { DateSystem } from "@/lib/jalali";

export type { DateSystem };

export async function getDateSystem(): Promise<DateSystem> {
  const c = await cookies();
  const val = c.get("date-system")?.value;
  return val === "gregorian" ? "gregorian" : "jalali";
}
