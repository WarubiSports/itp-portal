import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Identifies which repo a report came from so the Hermes auto-fix loop can
// route the fix to the right codebase. This repo serves Warubi Futures +
// trial onboarding flows.
// CONFIRM this string matches what the loop keys on (repo vs program).
const APP_SOURCE = "itp-trial-onboarding";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = (body.title || "").toString().trim();

    if (!title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }

    const { error } = await supabase.from("bug_reports").insert({
      title: title.slice(0, 200),
      description: body.description ? body.description.toString().slice(0, 4000) : null,
      page_url: body.page_url ? body.page_url.toString().slice(0, 500) : null,
      // reporter_id is a FK to staff_profiles; players aren't staff, so it
      // stays null. Player identity lives in reporter_name + page_url.
      reporter_name: body.reporter_name ? body.reporter_name.toString().slice(0, 200) : null,
      app_source: APP_SOURCE,
      status: "open",
      priority: "medium",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
