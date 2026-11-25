package com.nuvio.app.core.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toPixelMap
import coil3.PlatformContext
import coil3.SingletonImageLoader
import coil3.request.ImageRequest
import coil3.request.SuccessResult
import com.nuvio.app.features.details.components.loadedBackdropImageBitmap

/**
 * Ambient hero tint — the Zangetsu trick: pull the dominant colour out of the
 * hero artwork and wash the whole hero area with it so the page feels lit by
 * the content instead of a flat black sheet.
 *
 * The extraction is cheap (a 72px decode + a coarse colour histogram) and the
 * result is cached per URL, so paging the hero never re-decodes the same art.
 */
internal object HeroTint {

    private val cache = mutableMapOf<String, Color>()

    suspend fun dominantColor(context: PlatformContext, imageUrl: String): Color? {
        if (imageUrl.isBlank()) return null
        cache[imageUrl]?.let { return it }
        val loader = SingletonImageLoader.get(context)
        val request = ImageRequest.Builder(context)
            .data(imageUrl)
            .size(72)
            .build()
        val result = runCatching { loader.execute(request) }.getOrNull() as? SuccessResult ?: return null
        val bitmap = runCatching { loadedBackdropImageBitmap(result) }.getOrNull() ?: return null
        val color = dominantColorOf(bitmap) ?: return null
        cache[imageUrl] = color
        return color
    }

    /**
     * Coarse histogram of the artwork: bucket the pixels (5 bits per channel),
     * take the most common bucket and average its pixels. Bright, saturated
     * buckets win over dark ones so the wash stays visible.
     */
    private fun dominantColorOf(bitmap: ImageBitmap): Color? {
        val pixels = runCatching { bitmap.toPixelMap() }.getOrNull() ?: return null
        val width = pixels.width
        val height = pixels.height
        if (width <= 0 || height <= 0) return null

        // count, rSum, gSum, bSum per bucket
        val buckets = HashMap<Int, IntArray>()
        val stepX = (width / 24).coerceAtLeast(1)
        val stepY = (height / 24).coerceAtLeast(1)
        var y = 0
        while (y < height) {
            var x = 0
            while (x < width) {
                val color = pixels[x, y]
                if (color.alpha > 0.15f) {
                    val r = (color.red * 255f).toInt().coerceIn(0, 255)
                    val g = (color.green * 255f).toInt().coerceIn(0, 255)
                    val b = (color.blue * 255f).toInt().coerceIn(0, 255)
                    val key = ((r shr 3) shl 10) or ((g shr 3) shl 5) or (b shr 3)
                    val acc = buckets.getOrPut(key) { IntArray(4) }
                    acc[0] += 1
                    acc[1] += r
                    acc[2] += g
                    acc[3] += b
                }
                x += stepX
            }
            y += stepY
        }
        if (buckets.isEmpty()) return null

        var bestKey = -1
        var bestScore = -1f
        buckets.forEach { (key, acc) ->
            if (acc[0] <= 0) return@forEach
            val count = acc[0]
            val r = acc[1] / count
            val g = acc[2] / count
            val b = acc[3] / count
            // Prefer vivid, bright buckets — they make the nicest ambient wash.
            val maxChannel = maxOf(r, g, b)
            val minChannel = minOf(r, g, b)
            val saturation = if (maxChannel == 0) 0f else (maxChannel - minChannel).toFloat() / maxChannel
            val score = count * (0.35f + saturation) * (0.45f + maxChannel / 255f)
            if (score > bestScore) {
                bestScore = score
                bestKey = key
            }
        }
        if (bestKey < 0) return null
        val acc = buckets.getValue(bestKey)
        val count = acc[0]
        if (count <= 0) return null
        return Color(
            red = (acc[1] / count) / 255f,
            green = (acc[2] / count) / 255f,
            blue = (acc[3] / count) / 255f,
        )
    }
}
