package com.nuvio.app.core.build

/**
 * Feature flags for the Nuvio build. Restored from references in the source
 * (the original distribution-specific copy was missing from the backup).
 * "full" distribution: all features enabled.
 */
object AppFeaturePolicy {
    const val accountDeletionEnabled = true
    const val customServerConnectionsEnabled = true
    const val donationActionsEnabled = true
    const val donationProgressEnabled = true
    const val downloadForegroundServiceEnabled = true
    const val heroTrailerPlaybackSupported = true
    const val imdbRatingLogoEnabled = true
    const val inAppUpdaterEnabled = true
    const val mediaPlaybackForegroundServiceEnabled = true
    const val personalMediaAddonCopyEnabled = true
    const val p2pEnabled = false
    const val pluginsEnabled = true
    const val supportersContributorsPageEnabled = true
    val trailerPlaybackMode: TrailerPlaybackMode = TrailerPlaybackMode.IN_APP
}
