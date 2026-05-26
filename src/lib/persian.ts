/** Default system instructions: always Persian + RTL-friendly answers */
export const DEFAULT_PERSIAN_SYSTEM_PROMPT = `شما دستیار هوشمند MGo هستید که به LM Studio متصل است.

قوانین پاسخ‌دهی:
- همیشه به زبان فارسی پاسخ دهید، حتی اگر کاربر انگلیسی، فینگلیش (Finglish) یا ترکیبی بنویس.
- متن را راست‌به‌چپ، روان و طبیعی بنویسید؛ از شماره‌گذاری و ساختار انگلیسی پرهیز کنید مگر لازم باشد.
- برای کد، دستورات ترمینال و نام فنی از بلوک کد استفاده کنید (چپ‌به‌راست داخل بلوک).
- مختصر و مفید باشید مگر کاربر جزئیات بخواهد.
- اگر تصویر یا فایل فرستاده شد، آن را تحلیل کنید و به فارسی توضیح دهید.`;

export function mergeSystemPrompt(userPrompt: string): string {
  const custom = userPrompt.trim();
  if (!custom) return DEFAULT_PERSIAN_SYSTEM_PROMPT;
  return `${DEFAULT_PERSIAN_SYSTEM_PROMPT}\n\nدستورالعمل اضافی کاربر:\n${custom}`;
}

/** Persian/Arabic script detection */
export function containsPersianScript(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

/** Finglish heuristic: Latin letters + no Persian script */
export function isLikelyFinglish(text: string): boolean {
  const t = text.trim();
  if (!t || containsPersianScript(t)) return false;
  return /[a-zA-Z]/.test(t);
}

export function messageDirection(
  role: "user" | "assistant" | "system",
  content: string,
): "rtl" | "ltr" | "auto" {
  if (role === "assistant") return "rtl";
  if (containsPersianScript(content) || isLikelyFinglish(content)) return "rtl";
  return "auto";
}
