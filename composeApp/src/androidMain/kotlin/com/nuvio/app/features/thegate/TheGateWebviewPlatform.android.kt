// TheGateWebviewPlatform.android.kt — Android actual
// ------------------------------------------------------------------
// Opens AbyssWebViewActivity (WebView + AdBlock). The application context
// is bound once from MainActivity via bindTheGateWebviewContext().
// ------------------------------------------------------------------
package com.nuvio.app.features.thegate

import android.content.Context
import android.content.Intent

@Volatile
private var theGateWebviewContext: Context? = null

/** Call once from MainActivity.onCreate (or any Android entry point). */
fun bindTheGateWebviewContext(context: Context) {
    theGateWebviewContext = context.applicationContext
}

actual object TheGateWebviewPlatform {
    actual fun openAbyssStream(url: String): Boolean =
        launchFallback(url)

    actual fun openAbyssStream(
        url: String,
        onCaptured: (capturedUrl: String, referer: String?) -> Unit,
    ): Boolean = launchFallback(url) { captured ->
        onCaptured(captured.url, captured.referer)
    }

    private fun launchFallback(
        url: String,
        onCaptured: ((TheGateMediaCapture.Captured) -> Unit)? = null,
    ): Boolean {
        val ctx = theGateWebviewContext ?: return false
        return runCatching {
            if (onCaptured != null) {
                TheGateMediaCapture.beginCapture(onCaptured)
            }
            ctx.startActivity(
                Intent(ctx, AbyssWebViewActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    .putExtra(AbyssWebViewActivity.EXTRA_URL, url),
            )
        }.onFailure {
            TheGateMediaCapture.cancel()
        }.isSuccess
    }
}
