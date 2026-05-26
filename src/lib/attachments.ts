export interface PendingAttachment {
  id: string;
  type: "image" | "file";
  name: string;
  mimeType: string;
  dataUrl: string;
  textPreview?: string;
}

const MAX_IMAGE_MB = 8;
const MAX_FILE_MB = 2;

export async function fileToAttachment(file: File): Promise<PendingAttachment> {
  const id = crypto.randomUUID();
  const isImage = file.type.startsWith("image/");

  if (isImage && file.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error(`IMAGE_TOO_LARGE:${MAX_IMAGE_MB}`);
  }
  if (!isImage && file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`FILE_TOO_LARGE:${MAX_FILE_MB}`);
  }

  const dataUrl = await readAsDataUrl(file);

  let textPreview: string | undefined;
  if (
    !isImage &&
    (file.type.startsWith("text/") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".json"))
  ) {
    try {
      textPreview = await file.text();
      if (textPreview.length > 12000) {
        textPreview = `${textPreview.slice(0, 12000)}\n…`;
      }
    } catch {
      /* ignore */
    }
  }

  return {
    id,
    type: isImage ? "image" : "file",
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    dataUrl,
    textPreview,
  };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function buildUserMessageText(
  text: string,
  attachments: PendingAttachment[],
): string {
  const parts: string[] = [];
  if (text.trim()) parts.push(text.trim());

  for (const att of attachments) {
    if (att.textPreview) {
      parts.push(`\n\n📎 فایل «${att.name}»:\n\`\`\`\n${att.textPreview}\n\`\`\``);
    } else if (att.type === "file") {
      parts.push(`\n\n📎 فایل پیوست شده: ${att.name}`);
    }
  }

  return parts.join("");
}

export type ApiMessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export function buildApiUserContent(
  text: string,
  attachments: PendingAttachment[],
): ApiMessageContent {
  const images = attachments.filter((a) => a.type === "image");
  const fullText = buildUserMessageText(text, attachments);

  if (images.length === 0) {
    return fullText;
  }

  const content: ApiMessageContent = [];
  if (fullText) content.push({ type: "text", text: fullText });
  for (const img of images) {
    content.push({ type: "image_url", image_url: { url: img.dataUrl } });
  }
  return content;
}
