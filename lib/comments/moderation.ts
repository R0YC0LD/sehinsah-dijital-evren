import "server-only";

const BLOCKED_WORDS = [
  "amk",
  "amq",
  "aq",
  "orospu",
  "orospu cocugu",
  "pic",
  "yavsak",
  "siktir",
  "sikeyim",
  "sikerim",
  "sikik",
  "sikte",
  "got veren",
  "gotveren",
  "ibne",
  "gavat",
  "kahpe",
  "serefsiz",
  "pust",
  "yarrak",
  "yarak",
  "amcik",
  "sik",
  "oc",
  "gerizekali",
  "salak",
  "aptal",
  "mal herif",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "dick",
  "bastard",
  "whore",
  "slut",
  "nigger",
  "faggot",
];

function normalize(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/[İI]/g, "i")
    .replace(/ı/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/[^a-z0-9\s]/g, "");
}

export function containsProfanity(input: string): boolean {
  const normalized = normalize(input);
  const compact = normalized.replace(/\s+/g, "");
  return BLOCKED_WORDS.some((word) => {
    const compactWord = word.replace(/\s+/g, "");
    return compact.includes(compactWord) || normalized.includes(word);
  });
}

const TURKISH_LETTERS = "a-zA-ZçÇğĞıİöÖşŞüÜ";

export function isMalformedName(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 2) return true;
  if (!new RegExp(`[${TURKISH_LETTERS}]`).test(trimmed)) return true;
  if (/(.)\1{3,}/.test(trimmed)) return true;
  if (/https?:\/\/|www\.|\.(com|net|org|tr|xyz)\b/i.test(trimmed)) return true;
  if (!new RegExp(`^[${TURKISH_LETTERS}0-9 '.\\-]+$`).test(trimmed)) return true;
  const letters = trimmed.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ]/g, "");
  if (letters.length < Math.ceil(trimmed.replace(/\s/g, "").length * 0.5)) return true;
  return false;
}

export function isMalformedText(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 2) return true;
  if (!new RegExp(`[${TURKISH_LETTERS}]`).test(trimmed)) return true;
  if (/(.)\1{5,}/.test(trimmed)) return true;
  if (/https?:\/\/|www\./i.test(trimmed)) return true;
  return false;
}
