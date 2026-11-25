// TheGateWebviewPlatform.desktop.kt — Desktop actual (no WebView fallback).
package com.nuvio.app.features.thegate

actual object TheGateWebviewPlatform {
    actual fun openAbyssStream(url: String): Boolean = false

    actual fun openAbyssStream(
        url: String,
        onCaptured: (capturedUrl: String, referer: String?) -> Unit,
    ): Boolean = false
}
