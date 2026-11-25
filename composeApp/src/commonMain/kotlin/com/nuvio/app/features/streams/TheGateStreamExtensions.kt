// TheGateStreamExtensions.kt
// ------------------------------------------------------------------
// Adds "The Gate" helpers to the existing stream model without touching
// the serialized data classes. In particular it detects the Abyss
// encrypted-iframe streams so the app can route them to the Android
// WebView fallback instead of MPVKit.
// ------------------------------------------------------------------
package com.nuvio.app.features.streams

/**
 * True if this stream came from your "The Gate" addon (vs a third-party
 * addon). The addon id is stamped by the backend as `the.gate` and the
 * manifest URL matches your hardcoded Render endpoint.
 */
val StreamItem.isTheGateStream: Boolean
    get() = addonId.startsWith("the.gate") ||
        addonName.equals("The Gate", ignoreCase = true)

/**
 * True if the stream should be opened in the Android WebView fallback
 * (Abyss / encrypted iframe). The backend marks these streams with the
 * custom top-level `webview` field and/or a `host: "abyss"` name; we also
 * fall back to checking the URL domain.
 */
val StreamItem.shouldOpenInIframeFallback: Boolean
    get() = behaviorHints.theGateWebview || urlHostIsAbyss() || urlHostIsIframeHost()

private fun StreamItem.urlHostIsAbyss(): Boolean {
    val u = playableDirectUrl?.lowercase() ?: return false
    return u.contains("abyss.to") || u.contains("v2.abyss.to")
}

/**
 * Streamtape / MixDrop embed links sirf device IP par chalte hain (worker IP
 * se 403 / IP-lock). Inhe Android WebView fallback me kholo — mpv embed page
 * ko direct video nahi samajh paata (buffering pe atak jata hai).
 */
private fun StreamItem.urlHostIsIframeHost(): Boolean {
    val u = playableDirectUrl?.lowercase() ?: return false
    return u.contains("streamtape.com") || u.contains("stape.io") ||
        u.contains("mixdrop") || u.contains("mxdrop")
}
