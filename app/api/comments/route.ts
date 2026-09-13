import { NextResponse } from "next/server";
import { products } from "@/data/products";
import { addComment, listComments } from "@/lib/comments/store";
import { containsProfanity, isMalformedName, isMalformedText } from "@/lib/comments/moderation";

const NAME_MAX_LENGTH = 24;
const TEXT_MAX_LENGTH = 500;

export const dynamic = "force-dynamic";

function isValidProductId(id: unknown): id is string {
  return typeof id === "string" && products.some((p) => p.id === id);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!isValidProductId(productId)) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }
  return NextResponse.json({ comments: await listComments(productId) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { productId, name, text } = (body ?? {}) as Record<string, unknown>;

  if (!isValidProductId(productId)) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }

  if (typeof name !== "string" || !name.trim() || name.length > NAME_MAX_LENGTH) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  const trimmedName = name.trim();
  if (isMalformedName(trimmedName) || containsProfanity(trimmedName)) {
    return NextResponse.json({ error: "inappropriate_name" }, { status: 400 });
  }

  if (typeof text !== "string" || !text.trim() || text.length > TEXT_MAX_LENGTH) {
    return NextResponse.json({ error: "invalid_text" }, { status: 400 });
  }
  const trimmedText = text.trim();
  if (isMalformedText(trimmedText) || containsProfanity(trimmedText)) {
    return NextResponse.json({ error: "inappropriate_text" }, { status: 400 });
  }

  const comment = await addComment({ productId, name: trimmedName, text: trimmedText });
  return NextResponse.json({ comment }, { status: 201 });
}
