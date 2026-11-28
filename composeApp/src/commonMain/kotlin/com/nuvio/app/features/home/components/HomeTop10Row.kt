package com.nuvio.app.features.home.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nuvio.app.core.ui.NuvioPosterCard
import com.nuvio.app.core.ui.NuvioPosterShape
import com.nuvio.app.core.ui.nuvio
import com.nuvio.app.features.home.MetaPreview
import com.nuvio.app.features.home.stableKey

/**
 * Netflix-style "Top 10" shelf: oversized outlined rank numbers with the
 * poster overlapping the right half of the digit.
 */
@Composable
fun HomeTop10RowSection(
    title: String,
    items: List<MetaPreview>,
    modifier: Modifier = Modifier,
    sectionPadding: Dp = 16.dp,
    onPosterClick: ((MetaPreview) -> Unit)? = null,
) {
    if (items.isEmpty()) return

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(
            text = title,
            modifier = Modifier.padding(horizontal = sectionPadding),
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.nuvio.colors.textPrimary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        LazyRow(
            contentPadding = PaddingValues(horizontal = sectionPadding),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            itemsIndexed(
                items = items,
                key = { _, item -> "top10_${item.stableKey()}" },
            ) { index, item ->
                Box(
                    modifier = Modifier
                        .width(196.dp)
                        .clickable(enabled = onPosterClick != null) {
                            onPosterClick?.invoke(item)
                        },
                    contentAlignment = Alignment.BottomStart,
                ) {
                    Text(
                        text = "${index + 1}",
                        style = TextStyle(
                            fontSize = 112.sp,
                            lineHeight = 96.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White.copy(alpha = 0.92f),
                            shadow = Shadow(color = Color.Black, blurRadius = 12f),
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Clip,
                    )
                    NuvioPosterCard(
                        title = item.name,
                        imageUrl = item.poster,
                        modifier = Modifier.align(Alignment.BottomEnd),
                        fallbackImageUrl = item.rawPosterUrl,
                        shape = NuvioPosterShape.Poster,
                        showTitleBelow = false,
                        onClick = null,
                    )
                }
            }
        }
    }
}
