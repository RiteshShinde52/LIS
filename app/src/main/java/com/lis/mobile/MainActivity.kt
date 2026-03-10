package com.lis.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.room.Room
import com.lis.mobile.data.LisDatabase
import com.lis.mobile.data.LisRepository
import com.lis.mobile.ui.screens.LisApp
import com.lis.mobile.ui.theme.LisTheme
import com.lis.mobile.viewmodel.LisViewModel
import com.lis.mobile.viewmodel.LisViewModelFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val db = Room.databaseBuilder(applicationContext, LisDatabase::class.java, "lis.db").build()
        val repo = LisRepository(db.lisDao())

        setContent {
            LisTheme {
                val vm: LisViewModel = viewModel(factory = LisViewModelFactory(repo))
                LisApp(vm)
            }
        }
    }
}
