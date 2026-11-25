// AbyssWebViewActivity.kt
// ------------------------------------------------------------------
// Abyss.to fallback player. When a "The Gate" stream is flagged as an
// encrypted iframe (host = abyss), the app opens THIS activity instead
// of MPVKit. The WebView renders the iframe/stream page and an
// AdBlock interceptor blocks common ad/analytics domains so playback is
// not sabotaged and 403s are avoided.
// ------------------------------------------------------------------
package com.nuvio.app.features.thegate

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import java.io.ByteArrayInputStream

class AbyssWebViewActivity : ComponentActivity() {

    private var webView: WebView? = null

    @Volatile
    private var lastPageUrl: String? = null

    private val mediaCaptured = java.util.concurrent.atomic.AtomicBoolean(false)

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val url = intent.getStringExtra(EXTRA_URL)
        if (url.isNullOrBlank()) {
            Toast.makeText(this, "No Abyss stream URL", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // ---- AdBlock rule set (blocklist of common ad/tracker hosts) ----
        // Video-embed hosts (Abyss/MixDrop/Streamtape/Byse) ke apne ad stack bhi covered:
        // decafeligiblyhad.com (Abyss popup), pixel.morphify.net (Abyss beacon),
        // pagead2.googlesyndication.com (Abyss reqTrack), popads/Propeller/Adsterra etc.
        val blockedHosts = setOf(
            // Google / standard ad networks
            "doubleclick.net", "googlesyndication.com", "googleadservices.com",
            "googletagmanager.com", "adservice.google.com", "pagead2.googlesyndication.com",
            "google-analytics.com", "googletagservices.com", "googlesync.com",
            "adnxs.com", "pubmatic.com", "criteo.com", "taboola.com", "outbrain.com",
            "amazon-adsystem.com", "adsafeprotected.com", "casalemedia.com",
            "moatads.com", "rubiconproject.com", "bidswitch.net", "adroll.com",
            "cloudflareinsights.com", "scorecardresearch.com", "quantserve.com",
            "chartbeat.com", "hotjar.com", "newrelic.com", "sentry.io", "sentry-cdn.com",
            // Popup / popunder networks
            "popads.net", "popcash.net", "popunder.net", "popub.net", "poponclick.com",
            "popmyads.com", "popnhop.com", "popadscdn.net", "anticlick.com", "clickaine.com",
            "propellerads.com", "propellerclick.com", "mgid.com", "mgid.net",
            "adsterra.com", "asrvr.com", "adsterra-cdn.com", "adsterra.host",
            "hilltopads.com", "hilltopads.net", "exoclick.com", "exosrv.com",
            "admaven.com", "trafficstars.com", "trafficjunky.net", "revcontent.com",
            "tynt.com", "bouncex.com", "adf.ly", "shorte.st", "ouo.io", "adf.ly",
            "sparteo.com", "adpushup.com", "media.net", "medianet.com", "adgebra.in",
            "reklamstore.com", "kopet.com", "ad-maven.com", "gourl.io", "linkbucks.com",
            // Video-host specific
            "decafeligiblyhad.com", "pixel.morphify.net", "morphify.net",
            "streamadblocker.com", "tapwithus.com", "gcdn.anime",
            "animatead.com", "adnami.io", "wpserveur.net", "adthrive.com",
        )

        val progress = ProgressBar(this).apply {
            isIndeterminate = true
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
        }

        val wv = WebView(this)
        wv.setBackgroundColor(Color.BLACK)
        wv.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
        )
        webView = wv

        val container = FrameLayout(this)
        container.addView(progress)
        container.addView(wv)
        setContentView(container)

        wv.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = CHROME_ANDROID_UA
        }

        // Native-player hand-off: when the freshly-verified page starts loading
        // the actual video, report it once and finish() so the app can open the
        // native player (ExoPlayer) with the same session instead of the WebView.
        wv.addJavascriptInterface(MediaBridge(), BRIDGE_NAME)

        wv.webChromeClient = object : WebChromeClient() {
            // MixDrop "Quick verification: confirm you're human" ek JS confirm() hai —
            // default WebChromeClient ise suppress karta hai aur page ka JS flow atak jata hai.
            // Auto-confirm so the embed page proceeds to the player.
            override fun onJsAlert(
                view: WebView?,
                url: String?,
                message: String?,
                result: android.webkit.JsResult?,
            ): Boolean {
                result?.confirm()
                return true
            }

            override fun onJsConfirm(
                view: WebView?,
                url: String?,
                message: String?,
                result: android.webkit.JsResult?,
            ): Boolean {
                result?.confirm()
                return true
            }

            override fun onJsPrompt(
                view: WebView?,
                url: String?,
                message: String?,
                defaultValue: String?,
                result: android.webkit.JsPromptResult?,
            ): Boolean {
                result?.confirm(defaultValue)
                return true
            }
        } // lets HTML5 video play fullscreen + keeps JS dialogs working

        wv.webViewClient = object : WebViewClient() {
            // AdBlock interceptor
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest,
            ): WebResourceResponse? {
                val url = request.url.toString()
                if (isMediaUrl(url)) captureMedia(url)
                val host = request.url.host?.lowercase() ?: return null
                if (blockedHosts.any { host == it || host.endsWith(".$it") }) {
                    return WebResourceResponse(
                        "text/plain",
                        "utf-8",
                        ByteArrayInputStream("".toByteArray()),
                    )
                }
                return null
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progress.visibility = android.view.View.GONE
                if (!url.isNullOrBlank()) lastPageUrl = url
                // Poll for the <video> element; byse/mixdrop JWPlayer sets its
                // src only after the human-verify click. Report it once.
                view?.evaluateJavascript(
                    """(function(){
                        if (window.__theGateMediaHooked) return;
                        window.__theGateMediaHooked = 1;
                        var poll = setInterval(function(){
                            var v = document.querySelector('video');
                            var s = v && (v.currentSrc || v.src ||
                                (v.querySelector('source') && v.querySelector('source').src));
                            if (s && /^https?:/i.test(s) && !/\.(js|css|png|jpe?g|gif|svg|woff2?|ico)(\?|#|$)/i.test(s)) {
                                clearInterval(poll);
                                window.$BRIDGE_NAME.onMedia(s);
                            }
                        }, 500);
                    })();""",
                    null,
                )
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val host = request.url.host?.lowercase() ?: return false
                lastPageUrl = request.url.toString()
                val allowed = isNavigationAllowed(host)
                return !allowed
            }
        }

        wv.loadUrl(url)
    }

    /** True once the real media request is spotted on or inside this Activity. */
    private fun isMediaUrl(url: String): Boolean =
        MEDIA_URL_PATTERN.containsMatchIn(url) && !mediaCaptured.get()

    /**
     * Lenient variant for the <video> element poll: the element only points at
     * the real media, so any non-asset http(s) URL is good enough even when the
     * CDN serves extensionless signed URLs.
     */
    private fun isBridgeMediaUrl(url: String): Boolean =
        url.startsWith("http", ignoreCase = true) &&
            !ASSET_URL_PATTERN.containsMatchIn(url) &&
            !mediaCaptured.get()

    private fun captureMedia(url: String) {
        if (!mediaCaptured.compareAndSet(false, true)) return
        val referer = lastPageUrl
        runOnUiThread {
            TheGateMediaCapture.capture(url, referer)
            Toast.makeText(this, "Stream captured — opening player", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    /** JS bridge used by the poll snippet injected in onPageFinished. */
    private inner class MediaBridge {
        @android.webkit.JavascriptInterface
        fun onMedia(url: String?) {
            val u = url?.trim().orEmpty()
            if (isBridgeMediaUrl(u)) {
                captureMedia(u)
            }
        }
    }

    override fun onBackPressed() {
        val wv = webView
        if (wv != null && wv.canGoBack()) {
            wv.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // No capture happened (user backed out) — drop the pending sink so the
        // common code doesn't wait on a dead WebView.
        TheGateMediaCapture.cancel()
        webView?.destroy()
        webView = null
    }

    companion object {
        const val EXTRA_URL: String = "extra_abyss_url"

        private const val BRIDGE_NAME = "TheGateMediaBridge"
        private const val CHROME_ANDROID_UA =
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"

        // Direct media files the player hosts actually request once verified.
        private val MEDIA_URL_PATTERN =
            Regex("""\.(mp4|m3u8|mpd|webm|mkv)(\?|#|$)""", RegexOption.IGNORE_CASE)
        private val ASSET_URL_PATTERN =
            Regex("""\.(js|css|png|jpe?g|gif|svg|woff2?|ico|html?|json|xml)(\?|#|$)""", RegexOption.IGNORE_CASE)

        // In-host navigation allowed inside the WebView (player + its CDN partners).
        // Byse rotates its assigned embed domain per API key, so allow any host
        // whose name contains "byse" instead of pinning one static domain.
        private val ALLOWED_HOSTS = setOf(
            "abyss.to", "abyssplayer.com", "abyss.com",
            "streamtape.com", "streamtape.to", "streamtape.net",
            "mixdrop.co", "mixdrop.to", "mixdrop.ag", "mxdrop.click", "mxcontent.net",
            "byse.sx", "api.byse.sx", "bysetayico.com", "byse.workers.dev",
            "videothumbs.me", "iamcdn.net", "jwpsrv.com",
            "streamadblocker.com", "tapwithus.com", "gcdn.anime",
        )

        private fun isNavigationAllowed(host: String): Boolean =
            host.contains("byse") || ALLOWED_HOSTS.any { host == it || host.endsWith(".$it") }

        @JvmStatic
        fun launch(context: Context, url: String) {
            val intent = Intent(context, AbyssWebViewActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                .putExtra(EXTRA_URL, url)
            context.startActivity(intent)
        }
    }
}
