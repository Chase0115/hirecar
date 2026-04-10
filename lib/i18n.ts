import en from "@/lib/dictionaries/en.json";
import ko from "@/lib/dictionaries/ko.json";

export type Language = "en" | "ko";

export type Dictionary = typeof en;

const dictionaries: Record<Language, Dictionary> = { en, ko };

export function getDictionary(lang: Language): Dictionary {
  return dictionaries[lang];
}
