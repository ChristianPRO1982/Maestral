package com.maestral.mvpconnect

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.maestral.mvpconnect.ui.ConnectionScreen
import com.maestral.mvpconnect.ui.theme.MaestralTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaestralTheme {
                ConnectionScreen()
            }
        }
    }
}
