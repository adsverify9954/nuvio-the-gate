// TheGateConfig.kt
// ------------------------------------------------------------------
// "The Gate" — your permanent, hardcoded Render backend source.
// This is the ONLY addon source shipped with your Nuvio build; all
// public third-party addon/store URLs are removed elsewhere.
// ------------------------------------------------------------------
package com.nuvio.app.features.thegate

object TheGateConfig {
/**
 * Your "The Gate" backend manifest URL (keep trailing "/manifest.json").
 *
 * The value is generated at build time from `THE_GATE_MANIFEST` in
 * `local.properties`:
 *
 *   PRODUCTION (Cloudflare Worker, see cloudflare-the-gate/):
 *     THE_GATE_MANIFEST=https://the-gate.YOUR_SUBDOMAIN.workers.dev/manifest.json
 *
 *   LOCAL TEST (adb reverse tcp:8080 tcp:8080 + gate-backend):
 *     THE_GATE_MANIFEST=http://127.0.0.1:8080/manifest.json
 *
 * The Cloudflare worker serves the same Stremio endpoints
 * (manifest/catalog/meta/stream).
 */
const val RENDER_BACKEND_MANIFEST: String = TheGateEndpoint.MANIFEST

    /** Stable identifier used by the addon registry. */
    const val ADDON_ID: String = "the.gate"

    /**
     * Hard-lock the app to The Gate. When true, no third-party addon can
     * ever be shown, added or enabled: the list is filtered to
     * [RENDER_BACKEND_MANIFEST] only.
     */
    const val ADDONS_LOCKED: Boolean = true

    /** Convenient base for building resource URLs in the app. */
    val RENDER_BACKEND_BASE: String
        get() = RENDER_BACKEND_MANIFEST
            .substringBefore("?")
            .trimEnd('/')
            .removeSuffix("/manifest.json")
}
