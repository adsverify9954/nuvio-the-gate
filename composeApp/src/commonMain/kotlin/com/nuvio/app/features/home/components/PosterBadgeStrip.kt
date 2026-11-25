package com.nuvio.app.features.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nuvio.app.core.ui.NuvioPosterTag
import com.nuvio.app.features.home.MetaPreview

/**
 * Zangetsu-style poster badges.
 *
 * - quality ("4K" / "1080p" / "720p" / "480p" / "HD") → top-right corner
 * - score ("★ 8.4")                                    → top-right (only when no quality)
 * - audio ("DUB" / "SUB")                             → bottom-left corner
 */
internal data class PosterBadgeInfo(
    val quality: String? = null,
    val score: String? = null,
    val audio: String? = null,
)

private val QUALITY_PATTERNS: List<Pair<Regex, String>> = listOf(
    Regex("(?i)\\b2160p\\b") to "4K",
    Regex("(?i)\\b4k\\b") to "4K",
    Regex("(?i)\\b1080p\\b") to "1080p",
    Regex("(?i)\\b720p\\b") to "720p",
    Regex("(?i)\\b480p\\b") to "480p",
    Regex("(?i)\\b360p\\b") to "360p",
    Regex("(?i)\\bhdrip\\b") to "HD",
    Regex("(?i)\\bweb-?dl\\b") to "HD",
)

private val SUB_REGEX = Regex("(?i)(^|[^a-z])sub([^a-z]|$)")
private val DUB_REGEX = Regex("(?i)(^|[^a-z])dub([^a-z]|$)")

/**
 * Pulls quality / score / audio labels out of a catalog entry. Everything is
 * best-effort: entries without the data simply render no badge.
 */
internal fun MetaPreview.posterBadgeInfo(): PosterBadgeInfo {
    val haystack = buildString {
        append(name)
        releaseInfo?.let {
            append(' ')
            append(it)
        }
        if (genres.isNotEmpty()) {
            append(' ')
            append(genres.joinToString(" "))
        }
    }
    val quality = QUALITY_PATTERNS.firstOrNull { (pattern, _) -> pattern.containsMatchIn(haystack) }?.second
    val score = imdbRating
        ?.trim()
        ?.takeIf { it.isNotBlank() }
        ?.let { "★ $it" }
    val audio = when {
        DUB_REGEX.containsMatchIn(haystack) -> "DUB"
        SUB_REGEX.containsMatchIn(haystack) -> "SUB"
        else -> null
    }
    return PosterBadgeInfo(quality = quality, score = score, audio = audio)
}

/** Top-right corner badge: quality first, score as fallback. */
@Composable
fun HomePosterTopRightBadge(
    item: MetaPreview,
    modifier: Modifier = Modifier,
) {
    val badges = item.posterBadgeInfo()
    val label = badges.quality ?: badges.score ?: return
    NuvioPosterTag(
        text = label,
        modifier = modifier,
    )
}

/** Bottom-left corner badge: DUB / SUB audio marker. */
@Composable
fun HomePosterBottomLeftBadge(
    item: MetaPreview,
    modifier: Modifier = Modifier,
) {
    val badges = item.posterBadgeInfo()
    val label = badges.audio ?: return
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        NuvioPosterTag(text = label)
    }
}
