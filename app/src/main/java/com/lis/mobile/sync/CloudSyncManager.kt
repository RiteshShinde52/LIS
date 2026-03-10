package com.lis.mobile.sync

import kotlinx.coroutines.delay

class CloudSyncManager {
    suspend fun backupNow(): String {
        delay(600)
        return "Cloud backup queued (optional sync mode)."
    }
}
