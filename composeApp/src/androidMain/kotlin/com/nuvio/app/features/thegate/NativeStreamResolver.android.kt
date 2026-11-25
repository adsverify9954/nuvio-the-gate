package com.nuvio.app.features.thegate

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

private val sharedOkHttp = OkHttpClient.Builder()
    .connectTimeout(20, TimeUnit.SECONDS)
    .readTimeout(20, TimeUnit.SECONDS)
    .followRedirects(true)
    .followSslRedirects(true)
    .build()

actual suspend fun fetchHtmlWithHeaders(url: String, headers: Map<String, String>): String? =
    withContext(Dispatchers.IO) {
        runCatching {
            val builder = Request.Builder().url(url)
            for ((k, v) in headers) builder.header(k, v)
            sharedOkHttp.newCall(builder.build()).execute().use { resp ->
                println("MIXRES ${resp.code} $url")
                if (!resp.isSuccessful) return@use null
                resp.body?.string()
            }
        }.getOrElse { e ->
            println("MIXRES ERR $url ${e.message ?: e::class.simpleName}")
            null
        }
    }
