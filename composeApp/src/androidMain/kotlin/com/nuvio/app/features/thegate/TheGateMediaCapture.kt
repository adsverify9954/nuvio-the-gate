// TheGateMediaCapture.kt
// ------------------------------------------------------------------
// One-shot media-URL hand-off from the WebView fallback (AbyssWebViewActivity)
// back to the common code. The WebView fallback exists so the user can pass a
// host's "verify you are a human" gate; once playback starts the WebView
// spots the media request (mp4/m3u8/webm) and asks us to keep it instead.
// The episode opens in the native player (ExoPlayer / libmpv) with the
// correct Referer + Chrome UA instead of sitting inside the WebView.
//
// Exactly one capture per beginCapture() call. The sink is cleared on the
// first delivery and in onDestroy of the WebView activity (user backed out),
// so late/background captures never resurrect a dead request.
// ------------------------------------------------------------------
package com.nuvio.app.features.thegate

object TheGateMediaCapture {

    data class Captured(val url: String, val referer: String?)

    @Volatile
    private var sink: ((Captured) -> Unit)? = null

    /** Start waiting for a capture. Replaces any previous pending sink. */
    fun beginCapture(onCaptured: (Captured) -> Unit) {
        sink = onCaptured
    }

    /** Deliver a captured media URL. No-op when nobody is waiting. */
    fun capture(url: String, referer: String?) {
        val pending = sink
        sink = null
        pending?.invoke(Captured(url, referer))
    }

    /** Called when the WebView is closed without a capture (user backed out). */
    fun cancel() {
        sink = null
    }
}
