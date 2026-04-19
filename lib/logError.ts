import { supabase } from "./supabase";

const APP_NAME = "itp-portal";

type LogErrorInput = {
  route: string;
  error: unknown;
  context?: Record<string, unknown>;
};

/**
 * Write an error to the centralized error_log table. Never throws —
 * logging failures must not crash the request handler. Surfaced to
 * Claude at session start; Max only hears about it via Claude.
 */
export async function logError({ route, error, context }: LogErrorInput) {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    await supabase.from("error_log").insert({
      app: APP_NAME,
      route,
      error_message: message,
      error_stack: stack,
      context: context ?? null,
    });
  } catch {
    // Swallow — logging must never break the caller.
  }
}
