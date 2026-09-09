export const dynamic = "force-dynamic";

export function GET() {
  // Liveness only: this does not claim database or AI readiness.
  return Response.json(
    { status: "ok", service: "abangcebu-ai" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
