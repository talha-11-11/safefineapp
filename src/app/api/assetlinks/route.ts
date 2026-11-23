import { NextResponse } from "next/server";

/**
 * Digital Asset Links for the Android app (APK made with PWABuilder).
 * With ANDROID_SHA256 set on Render, the APK opens full screen with no browser bar.
 */
export function GET() {
  const pkg = process.env.ANDROID_PACKAGE || "com.pokitbio.safefine";
  const prints = (process.env.ANDROID_SHA256 || "").split(",").map((s) => s.trim()).filter(Boolean);
  const body = prints.length
    ? [{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints },
      }]
    : [];
  return NextResponse.json(body, { headers: { "cache-control": "public, max-age=300" } });
}
