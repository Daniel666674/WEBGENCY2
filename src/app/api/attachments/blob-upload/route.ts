import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// Issues short-lived client tokens so the browser can upload attachment
// files (contracts, mockups, etc.) straight to Blob storage, bypassing
// Vercel's hard 4.5MB request body limit on Serverless Functions entirely
// — a file routed through our own API route would be capped there before
// our code ever runs. Already behind the session-cookie gate in proxy.ts
// (this path isn't in its public-route exclusion list).
export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage no configurado en este entorno" },
      { status: 501 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
        maximumSizeInBytes: 50 * 1024 * 1024,
        cacheControlMaxAge: 31536000,
      }),
      // Not relied on for correctness: Vercel only calls this back on a real
      // deployment reachable from its infrastructure, not in local dev. The
      // attachment DB row is created by the client right after upload()
      // resolves (see AttachmentsTab.tsx) so the flow works either way.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error generando token de subida" },
      { status: 400 }
    );
  }
}
