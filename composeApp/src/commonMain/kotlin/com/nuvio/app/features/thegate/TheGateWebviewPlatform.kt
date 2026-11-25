// TheGateWebviewPlatform.kt — expect declaration (commonMain)
// ------------------------------------------------------------------
// The player routes Abyss-style encrypted-iframe streams here instead of
// MPVKit. Android uses the WebView fallback activity; other platforms
// have no fallback and simply report failure (the stream is skipped).
// ------------------------------------------------------------------
package com.nuvio.app.features.thegate

expect object TheGateWebviewPlatform {
    /**
     * Try to open [url] in the WebView fallback (Abyss / encrypted iframe).
     * @return true when the stream was handed off to the fallback.
     */
    fun openAbyssStream(url: String): Boolean

    /**
     * Same as [openAbyssStream], but when the verified page starts loading the
     * real media file, [onCaptured] receives its URL plus the Referer of the
     * embed page (the WebView closes at that point so the app can play the
     * URL in the native player). Called on an arbitrary thread — hop to the
     * UI dispatcher inside the callback if needed. If the user leaves the
     * WebView without playback starting, [onCaptured] is never invoked.
     */
    fun openAbyssStream(
        url: String,
        onCaptured: (capturedUrl: String, referer: String?) -> Unit,
    ): Boolean
}
