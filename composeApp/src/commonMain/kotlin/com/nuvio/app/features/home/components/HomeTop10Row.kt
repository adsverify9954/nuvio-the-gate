package com.nuvio.app.features.home.components

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.nuvio.app.core.ui.NuvioShelfSection
import com.nuvio.app.core.ui.NuvioViewAllPillSize
import com.nuvio.app.core.ui.rememberPosterCardStyleUiState
import com.nuvio.app.features.home.MetaPreview
import com.nuvio.app.features.home.stableKey
import com.nuvio.app.features.watching.application.WatchingState
import nuvio.composeapp.generated.resources.Res
import nuvio.composeapp.generated.resources.home_my_list_title
import nuvio.composeapp.generated.resources.home_top10_title
import org.jetbrains.compose.resources.stringResource

private data class Top10Entry(
    val rank: Int,
    val item: MetaPreview,
)

/**
 * Netflix-style "Top 10" row: the rank sits to the left of each poster as a
 * big outlined numeral, exactly like the real service.
 */
@Composable
fun HomeTop10Row(
    items: List<MetaPreview>,
    modifier: Modifier = Modifier,
    sectionPadding: Dp? = null,
    watchedKeys: Set<String> = emptySet(),
    fullyWatchedSeriesKeys: Set<String> = emptySet(),
    onViewAllClick: (() -> Unit)? = null,
    onPosterClick: ((MetaPreview) -> Unit)? = null,
    onPosterLongClick: ((MetaPreview) -> Unit)? = null,
) {
    if (items.isEmpty()) return
    val posterCardStyle = rememberPosterCardStyleUiState()
    val entries = remember(items) {
        items.mapIndexed { index, item -> Top10Entry(rank = index + 1, item = item) }
    }

    val content: @Composable (Top10Entry) -> Unit = { entry ->
        Row(
            verticalAlignment = Alignment.Bottom,
        ) {
            androidx.compose.material3.Text(
                text = entry.rank.toString(),
                style = MaterialTheme.typography.displayMedium.copy(
                    color = Color.White.copy(alpha = 0.92f),
                    drawStyle = Stroke(width = 3f),
                ),
                maxLines = 1,
                overflow = TextOverflow.Clip,
                modifier = Modifier.widthIn(min = 30.dp),
            )
            HomePosterCard(
                item = entry.item,
                useLandscapeBackdropMode = posterCardStyle.catalogLandscapeModeEnabled,
                isWatched = WatchingState.isPosterWatched(
                    watchedKeys = watchedKeys,
                    item = entry.item,
                    fullyWatchedSeriesKeys = fullyWatchedSeriesKeys,
                ),
                onClick = onPosterClick?.let { { it(entry.item) } },
                onLongClick = onPosterLongClick?.let { { it(entry.item) } },
            )
        }
    }

    if (sectionPadding != null) {
        NuvioShelfSection(
            title = stringResource(Res.string.home_top10_title),
            entries = entries,
            modifier = modifier.fillMaxWidth(),
            headerHorizontalPadding = sectionPadding,
            rowContentPadding = PaddingValues(horizontal = sectionPadding),
            onViewAllClick = onViewAllClick,
            viewAllPillSize = NuvioViewAllPillSize.Compact,
            key = { entry -> entry.item.stableKey() },
        ) { entry -> content(entry) }
    } else {
        BoxWithConstraints(modifier = modifier.fillMaxWidth()) {
            val padding = homeSectionHorizontalPaddingForWidth(maxWidth.value)
            NuvioShelfSection(
                title = stringResource(Res.string.home_top10_title),
                entries = entries,
                modifier = Modifier.fillMaxWidth(),
                headerHorizontalPadding = padding,
                rowContentPadding = PaddingValues(horizontal = padding),
                onViewAllClick = onViewAllClick,
                viewAllPillSize = NuvioViewAllPillSize.Compact,
                key = { entry -> entry.item.stableKey() },
            ) { entry -> content(entry) }
        }
    }
}

/**
 * "My List" row — saved (library) titles surfaced directly on the home
 * screen, like Netflix does.
 */
@Composable
fun HomeMyListRow(
    items: List<MetaPreview>,
    modifier: Modifier = Modifier,
    sectionPadding: Dp? = null,
    watchedKeys: Set<String> = emptySet(),
    fullyWatchedSeriesKeys: Set<String> = emptySet(),
    onViewAllClick: (() -> Unit)? = null,
    onPosterClick: ((MetaPreview) -> Unit)? = null,
    onPosterLongClick: ((MetaPreview) -> Unit)? = null,
) {
    if (items.isEmpty()) return
    val posterCardStyle = rememberPosterCardStyleUiState()

    val content: @Composable (MetaPreview) -> Unit = { item ->
        HomePosterCard(
            item = item,
            useLandscapeBackdropMode = posterCardStyle.catalogLandscapeModeEnabled,
            isWatched = WatchingState.isPosterWatched(
                watchedKeys = watchedKeys,
                item = item,
                fullyWatchedSeriesKeys = fullyWatchedSeriesKeys,
            ),
            onClick = onPosterClick?.let { { it(item) } },
            onLongClick = onPosterLongClick?.let { { it(item) } },
        )
    }

    if (sectionPadding != null) {
        NuvioShelfSection(
            title = stringResource(Res.string.home_my_list_title),
            entries = items,
            modifier = modifier.fillMaxWidth(),
            headerHorizontalPadding = sectionPadding,
            rowContentPadding = PaddingValues(horizontal = sectionPadding),
            onViewAllClick = onViewAllClick,
            viewAllPillSize = NuvioViewAllPillSize.Compact,
            key = { item -> item.stableKey() },
            itemContent = content,
        )
    } else {
        BoxWithConstraints(modifier = modifier.fillMaxWidth()) {
            val padding = homeSectionHorizontalPaddingForWidth(maxWidth.value)
            NuvioShelfSection(
                title = stringResource(Res.string.home_my_list_title),
                entries = items,
                modifier = Modifier.fillMaxWidth(),
                headerHorizontalPadding = padding,
                rowContentPadding = PaddingValues(horizontal = padding),
                onViewAllClick = onViewAllClick,
                viewAllPillSize = NuvioViewAllPillSize.Compact,
                key = { item -> item.stableKey() },
                itemContent = content,
            )
        }
    }
}
