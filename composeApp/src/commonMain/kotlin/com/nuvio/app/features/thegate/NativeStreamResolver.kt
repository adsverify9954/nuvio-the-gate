package com.nuvio.app.features.thegate

/**
 * Device-side direct-play resolution for "The Gate" streams.
 *
 * WebView fallback ke bajaye native player me chalana hai to humein host ka
 * direct media URL (mp4/m3u8) chahiye. MixDrop embed page ka packed JS
 * (Dean Edwards) unpack karke MDCore.wurl nikalta hai — same algorithm jo
 * Cloudflare worker me use hota hai, bas yahan device ke network/IP par chalta
 * hai (signed URLs device session ke liye valid).
 */
object NativeStreamResolver {

    private val charMap = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

    // The packed `eval(function(p,a,c,k,e…` block is NOT always at the start of the
    // <script> body — these pages put plain config first and the pack at the end,
    // so find it anywhere and slice from there.
    private val packedEvalRe by lazy { Regex("""eval\(function\(p,a,c,k,e""", RegexOption.IGNORE_CASE) }

    /** "}('...',base,count,'k1|k2...'" pattern ko bina regex parse karo. */
    private fun parsePackParams(raw: String): Array<String>? {
        val start = raw.indexOf("}('")
        if (start < 0) return null
        var i = start + 3
        val p = StringBuilder()
        while (i < raw.length && raw[i] != '\'') {
            if (raw[i] == '\\' && i + 1 < raw.length) { p.append(raw[i + 1]); i += 2 } else { p.append(raw[i]); i++ }
        }
        if (i >= raw.length || raw[i] != '\'') return null
        i++ // skip closing quote
        if (i >= raw.length || raw[i] != ',') return null
        i++
        val baseStart = i
        while (i < raw.length && raw[i] != ',') i++
        if (i >= raw.length) return null
        val base = raw.substring(baseStart, i).toIntOrNull() ?: 62
        i++
        val countStart = i
        while (i < raw.length && raw[i] != ',') i++
        if (i >= raw.length) return null
        val count = raw.substring(countStart, i).toIntOrNull() ?: 0
        i++
        if (i >= raw.length || raw[i] != '\'') return null
        i++
        val kStart = i
        while (i < raw.length && raw[i] != '\'') i++
        if (i >= raw.length) return null
        val k = raw.substring(kStart, i).split("|")
        return arrayOf(p.toString(), base.toString(), count.toString(), k.joinToString("|"))
    }

    private fun baseCoder(value: Int, base: Int): StringBuilder {
        val out = StringBuilder()
        if (base <= 36) {
            var n = value
            if (n == 0) return out.append('0')
            while (n > 0) {
                out.insert(0, charMap[n % base])
                n /= base
            }
            return out
        }
        var n = value
        do {
            out.insert(0, charMap[n % base])
            n /= base
        } while (n > 0)
        return out
    }

    fun unpackPackedJs(input: String): String? {
        val raw = input
        val packStart = packedEvalRe.find(raw)?.range?.first ?: return null
        val text = raw.substring(packStart)
        val parts = parsePackParams(text) ?: return null
        val pBody = parts[0]
        val base = parts[1].toIntOrNull() ?: 62
        val count = parts[2].toIntOrNull() ?: 0
        val k = parts[3].split("|")
        val r = HashMap<String, String>()
        for (i in 0 until count) {
            r[baseCoder(i, base).toString()] = k.getOrElse(i) { baseCoder(i, base).toString() }
        }
        var decoded = pBody
        for (i in count - 1 downTo 0) {
            val token = baseCoder(i, base).toString()
            val replacement = k.getOrElse(i) { token }
            if (replacement != token) {
                decoded = decoded.replace(Regex("\\b" + Regex.escape(token) + "\\b"), replacement)
            }
        }
        return decoded
    }

    private fun normalizeUrl(u: String): String =
        if (u.startsWith("//")) "https:$u" else u

    /**
     * Worker-proxy URLs ko bhi embed ref me convert kar do — DB me kabhi-kabhi
     * stale "https://<worker>/proxy/mx/<ref>" ya "/proxy/st/<ref>" URLs pade hote hain
     * jinhe app device-side resolve karke native player me chala sakti hai.
     * Non-proxy URLs par null return karta hai.
     */
    private val proxyMxRef = Regex("""/proxy/mx/([A-Za-z0-9]+)""")
    private val proxyStRef = Regex("""/proxy/st/([A-Za-z0-9]+)""")

    fun gateEmbedFor(url: String): String? {
        proxyMxRef.find(url)?.let { return "https://mxdrop.click/e/" + it.groupValues[1] }
        proxyStRef.find(url)?.let { return "https://streamtape.com/e/" + it.groupValues[1] }
        return null
    }

    private fun originOf(u: String): String? =
        Regex("""^https?://[^/]+/?""").find(u)?.value?.let { o -> if (o.endsWith("/")) o else "$o/" }

    /** Minimal %XX decoder (commonMain has no java.net). */
    private fun percentDecode(s: String): String {
        val out = StringBuilder(s.length)
        var i = 0
        while (i < s.length) {
            val c = s[i]
            if (c == '%' && i + 3 <= s.length) {
                val v = s.substring(i + 1, i + 3).toIntOrNull(16)
                if (v != null) {
                    out.append(v.toChar())
                    i += 3
                    continue
                }
            }
            out.append(c)
            i++
        }
        return out.toString()
    }

    /** Resolved native candidate: direct media URL + the Referer the player expects. */
    data class NativeEmbedResolved(val directUrl: String, val referer: String)

    /**
     * resolveEmbed ko hostke hisab se route karo: streamtape embed (ya proxy/st URL)
     * → streamtape resolver; baaki mixdrop/mxdrop/byse family wala unpacker use karo.
     */
    suspend fun resolve(url: String): Result<NativeEmbedResolved> {
        val target = gateEmbedFor(url) ?: url
        return if (target.contains("streamtape", ignoreCase = true)) {
            resolveStreamtape(target)
        } else {
            resolveEmbed(target)
        }
    }

    /**
     * Streamtape embed page (/e/ ya /v/) → direct mp4. Page get_video URL JS se banta hai
     * (robotlink.innerHTML = 'BASE' + ('STR').substring(A)...), isliye manual parse.
     */
    suspend fun resolveStreamtape(embedUrl: String): Result<NativeEmbedResolved> {
        val origin = originOf(embedUrl)
            ?: return Result.failure(IllegalStateException("bad embed url"))
        val html = fetchHtmlWithHeaders(
            embedUrl,
            mapOf(
                "Referer" to origin,
                "Origin" to origin.trimEnd('/'),
                "User-Agent" to "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
            ),
        ) ?: return Result.failure(IllegalStateException("embed fetch failed"))
        fun direct(rawUrl: String): Result<NativeEmbedResolved> =
            Result.success(NativeEmbedResolved(fixUrl(rawUrl, origin), origin))
        // 1) Statically signed get_video URL (agar seedha page me ho to bas copy)
        Regex("""https?:[^'"\s]*get_video\?[^'"\s]*""")
            .find(html)?.let { return direct(it.value.replace("&amp;", "&")) }
        // 2) robotlink.innerHTML = 'BASE' + ('STR').substring(A)[.substring(B)]  (LAST match valid)
        val exprRe = Regex("""getElementById\(['"]robotlink['"]\)\.innerHTML\s*=\s*['"]([^'"]*)['"]\s*\+\s*\('([^']*)'\)((?:\.substring\(\d+\))+)""")
        var last: MatchResult? = null
        for (m in exprRe.findAll(html)) last = m
        val l = last
        if (l != null) {
            var s = l.groupValues[2]
            for (x in Regex("""\.substring\((\d+)\)""").findAll(l.groupValues[3])) {
                val n = x.groupValues[1].toInt()
                if (n < s.length) s = s.substring(n)
            }
            return direct(l.groupValues[1] + s)
        }
        // 3) Plain robotlink div content (kabhi kabhi seedha signed URL deta hai)
        Regex("""id="(?:robotlink|botlink|ideoolink)"[^>]*>([^<]+)<""")
            .find(html)?.groupValues?.get(1)?.trim()?.takeIf { it.isNotBlank() }
            ?.let { return direct(it) }
        // 4) NEW obfuscation (2026): Streamtape ne robotlink hata kar naye div-ids
        //    (ideoooolink/norobotlink/captchalink) use kiye aur expr ab
        //    "BASE" + ''+ ('STR').substring(1).substring(2) form me hai. Generic
        //    JS-concat evaluator: sab assignments evaluate karo, LAST get_video wali real hai
        //    (static divs me decoy token hota hai — sirf JS-built URL chalega).
        val assignRe = Regex("""getElementById\(['"][A-Za-z]+['"]\)\.innerHTML\s*=\s*([^;\n]+);""")
        var lastUrl: String? = null
        for (m in assignRe.findAll(html)) {
            val ev = evalConcatJs(m.groupValues[1])
            if (ev.contains("get_video")) lastUrl = ev
        }
        if (lastUrl != null) return direct(lastUrl)
        return Result.failure(IllegalStateException("no streamtape robotlink (html ${html.length})"))
    }

    /** Streamtape ke robotlink-style JS concat expr ko evaluate karo:
     *  "BASE" + ''+ ('STR').substring(1).substring(2) → final string.
     *  ('...')(.substring(n))+ unit pehle compute hote hain, phir bache hue
     *  quoted literals + substituted values order me jod dete hain.
     */
    private fun evalConcatJs(expr: String): String {
        val unitRe = Regex("""\(\s*['"]([^'"]*)['"]\s*\)((?:\s*\.\s*substring\s*\(\s*\d+\s*\))+)""")
        var out = unitRe.replace(expr) { m ->
            var s = m.groupValues[1]
            for (x in Regex("""substring\s*\(\s*(\d+)\s*\)""").findAll(m.groupValues[2])) {
                val n = x.groupValues[1].toInt()
                // JS substring semantics: n >= length → empty string
                s = if (n >= s.length) "" else s.substring(n)
            }
            s
        }
        return out.replace("+", "").replace("'", "").replace("\"", "").replace(" ", "")
    }

    /** streamtape ke weird URL forms: '////host/path', '//host/path', '/path', absolute. */
    private fun fixUrl(u: String, origin: String): String {
        val t = u.trim().replace("&amp;", "&")
        return when {
            t.startsWith("////") -> "https://" + t.trimStart('/')
            t.startsWith("//") -> "https:" + t
            t.startsWith("/") -> origin.trimEnd('/') + t
            else -> t
        }
    }

    /** Embed page URL (mixdrop/mxdrop/byse style — the exact URL The Gate serves in the
     *  stream item) → direct mp4/m3u8. The page carries a Dean Edwards packed block at the
     *  bottom (plain config lives above it); the signed media URL is device-session valid.
     */
    suspend fun resolveEmbed(embedUrl: String): Result<NativeEmbedResolved> {
        val origin = originOf(embedUrl)
            ?: return Result.failure(IllegalStateException("bad embed url"))
        val html = fetchHtmlWithHeaders(
            embedUrl,
            mapOf(
                "Referer" to origin,
                "Origin" to origin.trimEnd('/'),
                "User-Agent" to "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
            ),
        ) ?: return Result.failure(IllegalStateException("embed fetch failed"))
        fun result(rawUrl: String, referer: String?): Result<NativeEmbedResolved> =
            Result.success(
                NativeEmbedResolved(
                    directUrl = normalizeUrl(rawUrl),
                    referer = referer ?: origin,
                ),
            )
        for (script in Regex("<script[^>]*>([\\s\\S]*?)</script>", RegexOption.IGNORE_CASE).findAll(html)) {
            val body = script.groupValues[1]
            if (!Regex("MDCore|wurl", RegexOption.IGNORE_CASE).containsMatchIn(body)) continue
            val decoded = unpackPackedJs(body) ?: continue
            val wurl = Regex("""(?:MDCore\.wurl|wurl)\s*=\s*['"]([^'"]+)['"]""", RegexOption.IGNORE_CASE)
                .find(decoded)?.groupValues?.get(1)
            val referer = Regex("""referrer=["']([^"']+)["']""", RegexOption.IGNORE_CASE)
                .find(decoded)?.groupValues?.get(1)
                ?.let(::percentDecode)
            if (wurl != null) return result(wurl, referer)
            val urls = Regex("""https?:[^\s'"]+""").findAll(decoded).map { it.value }.toList()
            if (urls.isNotEmpty()) return result(urls.last(), referer)
        }
        val plain = Regex("""(?:MDCore\.wurl|wurl)\s*=\s*['"]([^'"]+)['"]""", RegexOption.IGNORE_CASE)
            .find(html)?.groupValues?.get(1)
        if (plain != null) return result(plain, null)
        return Result.failure(IllegalStateException("no wurl (html ${html.length})"))
    }
}

/** True jab stream URL kisi embed host ka ho jiska device-side unpack ho sakta hai. */
fun String.isNativeResolvableEmbed(): Boolean =
    Regex("mixdrop|mxdrop|byse|streamtape|/proxy/st/|/proxy/mx/", RegexOption.IGNORE_CASE)
        .containsMatchIn(this)

/** Platform-native simple HTML fetch (Android: OkHttp, baaki: Ktor). */
expect suspend fun fetchHtmlWithHeaders(url: String, headers: Map<String, String>): String?
