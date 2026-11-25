package com.nuvio.app.core.ui

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

/**
 * Zangetsu brand mark: a crescent moon with a crimson slash, drawn in-canvas so
 * it scales cleanly and needs no vector asset.
 */
@Composable
fun ZangetsuMark(
    modifier: Modifier = Modifier,
    moonColor: Color = Color.White,
    slashColor: Color = Color(0xFFFF4D57),
) {
    Canvas(modifier = modifier) {
        ZangetsuMarkBody(moonColor = moonColor, slashColor = slashColor)
    }
}

private fun DrawScope.ZangetsuMarkBody(
    moonColor: Color,
    slashColor: Color,
) {
    val radius = size.minDimension * 0.42f
    val center = Offset(size.width / 2f, size.height / 2f)

    // Crescent: full moon on an offscreen layer, then carve the dark side out.
    val paint = Paint()
    drawContext.canvas.saveLayer(Rect(0f, 0f, size.width, size.height), paint)
    drawCircle(color = moonColor, radius = radius, center = center)
    drawCircle(
        color = Color.Black,
        radius = radius * 0.90f,
        center = Offset(center.x + radius * 0.44f, center.y - radius * 0.32f),
        blendMode = BlendMode.DstOut,
    )
    drawContext.canvas.restore()

    // The slash.
    drawLine(
        color = slashColor,
        start = Offset(center.x - radius * 0.74f, center.y + radius * 0.80f),
        end = Offset(center.x + radius * 0.80f, center.y - radius * 0.74f),
        strokeWidth = radius * 0.18f,
        cap = StrokeCap.Round,
    )
}
