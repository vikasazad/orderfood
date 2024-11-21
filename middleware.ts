import { NextResponse } from "next/server";

export function middleware(req: Request) {
  console.log("MIDDLEWARE");
  const url = new URL(req.url);
  const data = url.searchParams.get("data");
  const table = url.searchParams.get("table");

  if (!data || !table) {
    return NextResponse.redirect(new URL("/error", req.url));
  }

  return NextResponse.next();
}
