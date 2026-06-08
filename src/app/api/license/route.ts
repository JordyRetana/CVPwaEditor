import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  licenseKey: z.string().min(8),
  deviceHash: z.string().min(32)
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const baseUrl = process.env.LICENSE_API_BASE_URL ?? "https://cvdesktopeditor-license-api.onrender.com";

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/licenses/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: body.licenseKey,
        deviceHash: body.deviceHash,
        appVersion: "pwa-0.1.0"
      })
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        {
          active: false,
          message:
            response.status === 403
              ? "La licencia fue rechazada, vencio o ya esta usada en otro dispositivo."
              : "No se pudo activar la licencia."
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(text) as {
      success?: boolean;
      expiresAt?: string | null;
      message?: string;
    };

    return NextResponse.json({
      active: Boolean(data.success),
      expiresAt: data.expiresAt ?? null,
      message: data.message ?? "Licencia activada."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error validando licencia.";
    return NextResponse.json({ active: false, message }, { status: 400 });
  }
}
