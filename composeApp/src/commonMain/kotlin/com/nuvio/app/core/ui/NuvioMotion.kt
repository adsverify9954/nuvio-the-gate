package com.nuvio.app.core.ui

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.FiniteAnimationSpec
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize

/**
 * Shared motion language for the app.
 *
 * One place for durations + easings so every surface (hero, shelves, posters,
 * sheets) feels like the same product instead of a pile of one-off animations.
 */
object NuvioMotion {

    /** Quick feedback (press, ripple-like state changes). */
    const val Fast: Int = 160

    /** Default transition length (screen/element enter-exit, crossfades). */
    const val Medium: Int = 300

    /** Heroic motion (hero zoom, big sheets, pager settles). */
    const val Slow: Int = 520

    /** Material-ish emphasized curve: fast out, soft landing. */
    val Emphasized: Easing = CubicBezierEasing(0.2f, 0f, 0f, 1f)

    /** Gentle curve for large surfaces that should feel weighty, never bouncy. */
    val Gentle: Easing = CubicBezierEasing(0.4f, 0f, 0.2f, 1f)

    /** Soft overshoot for playful micro-interactions (poster press). */
    fun pressScale(): FiniteAnimationSpec<Float> = spring(
        dampingRatio = 0.72f,
        stiffness = Spring.StiffnessMediumLow,
    )

    /** Stiff, snappy spring for scale/opacity pops. */
    fun snappy(): FiniteAnimationSpec<Float> = spring(
        dampingRatio = Spring.DampingRatioNoBouncy,
        stiffness = Spring.StiffnessMedium,
    )

    fun fade(durationMs: Int = Medium): FiniteAnimationSpec<Float> = tween(
        durationMillis = durationMs,
        easing = Emphasized,
    )

    fun slide(durationMs: Int = Medium): FiniteAnimationSpec<Float> = tween(
        durationMillis = durationMs,
        easing = Emphasized,
    )

    /** Size-driven animations (expand/shrink) - e.g. the search dropdown. */
    fun <T> expand(durationMs: Int = Fast): FiniteAnimationSpec<T> = tween(
        durationMillis = durationMs,
        easing = Emphasized,
    )

    /** Stagger helper: index -> delay so a row reveals left-to-right. */
    fun staggerDelay(index: Int, stepMs: Int = 45, maxMs: Int = 320): Int =
        (index * stepMs).coerceAtMost(maxMs)
}
