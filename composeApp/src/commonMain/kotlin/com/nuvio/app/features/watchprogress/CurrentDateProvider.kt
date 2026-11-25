package com.nuvio.app.features.watchprogress

expect object CurrentDateProvider {
    fun todayIsoDate(): String
    fun nowEpochMs(): Long
    fun localStartOfDayEpochMs(isoDate: String): Long?
}
