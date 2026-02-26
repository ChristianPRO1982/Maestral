package com.maestral.mvpconnect.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.maestral.mvpconnect.ConnectionRole
import com.maestral.mvpconnect.ConnectionStatus
import com.maestral.mvpconnect.ConnectionUiState
import com.maestral.mvpconnect.ConnectionViewModel

@Composable
fun ConnectionScreen(viewModel: ConnectionViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Maestral MVP Connexion",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "Valider la connexion locale entre 2 appareils",
                style = MaterialTheme.typography.bodyMedium
            )

            RoleSelector(
                selectedRole = state.role,
                onHost = viewModel::selectHost,
                onJoin = viewModel::selectJoin
            )

            StatusCard(state = state)

            when (state.role) {
                ConnectionRole.HOST -> HostForm(
                    state = state,
                    onPortChanged = viewModel::updatePort,
                    onTokenChanged = viewModel::updateToken,
                    onRefreshIps = viewModel::refreshLocalIps,
                    onRegenerateToken = viewModel::regenerateToken,
                    onStartHost = viewModel::startHost,
                    onStop = viewModel::stopSession
                )

                ConnectionRole.JOIN -> JoinForm(
                    state = state,
                    onHostChanged = viewModel::updateHostAddress,
                    onPortChanged = viewModel::updatePort,
                    onTokenChanged = viewModel::updateToken,
                    onJoin = viewModel::joinHost,
                    onStop = viewModel::stopSession
                )

                ConnectionRole.NONE -> Text(
                    text = "Selectionne d'abord un mode.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            if (state.status == ConnectionStatus.CONNECTED) {
                ConnectedActions(
                    state = state,
                    onMessageChanged = viewModel::updateMessage,
                    onSendPing = viewModel::sendPing,
                    onSendMessage = viewModel::sendMessage
                )
            }

            EventLog(events = state.events)
        }
    }
}

@Composable
private fun RoleSelector(
    selectedRole: ConnectionRole,
    onHost: () -> Unit,
    onJoin: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Button(
            onClick = onHost,
            modifier = Modifier.weight(1f),
            enabled = selectedRole != ConnectionRole.HOST
        ) {
            Text("Mode Host")
        }
        Button(
            onClick = onJoin,
            modifier = Modifier.weight(1f),
            enabled = selectedRole != ConnectionRole.JOIN
        ) {
            Text("Mode Join")
        }
    }
}

@Composable
private fun StatusCard(state: ConnectionUiState) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(text = "Etat: ${state.status}", fontWeight = FontWeight.SemiBold)
            Text(text = state.statusMessage, style = MaterialTheme.typography.bodyMedium)
            if (state.peerEndpoint.isNotBlank()) {
                Text(text = "Pair: ${state.peerEndpoint}", style = MaterialTheme.typography.bodySmall)
            }
            state.errorMessage?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

@Composable
private fun HostForm(
    state: ConnectionUiState,
    onPortChanged: (String) -> Unit,
    onTokenChanged: (String) -> Unit,
    onRefreshIps: () -> Unit,
    onRegenerateToken: () -> Unit,
    onStartHost: () -> Unit,
    onStop: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = state.portInput,
                onValueChange = onPortChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Port") },
                singleLine = true
            )
            OutlinedTextField(
                value = state.tokenInput,
                onValueChange = onTokenChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Token") },
                singleLine = true
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = onRegenerateToken) { Text("Nouveau token") }
                TextButton(onClick = onRefreshIps) { Text("Rafraichir IP") }
            }

            Text(text = "IP locales:")
            state.localIps.forEach { item ->
                Text(text = "- $item", style = MaterialTheme.typography.bodySmall)
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onStartHost, enabled = state.status != ConnectionStatus.HOSTING) {
                    Text("Start Hosting")
                }
                TextButton(onClick = onStop) {
                    Text("Stop")
                }
            }
        }
    }
}

@Composable
private fun JoinForm(
    state: ConnectionUiState,
    onHostChanged: (String) -> Unit,
    onPortChanged: (String) -> Unit,
    onTokenChanged: (String) -> Unit,
    onJoin: () -> Unit,
    onStop: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = state.hostAddressInput,
                onValueChange = onHostChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("IP Host") },
                singleLine = true
            )
            OutlinedTextField(
                value = state.portInput,
                onValueChange = onPortChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Port") },
                singleLine = true
            )
            OutlinedTextField(
                value = state.tokenInput,
                onValueChange = onTokenChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Token") },
                singleLine = true
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onJoin, enabled = state.status != ConnectionStatus.JOINING) {
                    Text("Connect")
                }
                TextButton(onClick = onStop) {
                    Text("Stop")
                }
            }
        }
    }
}

@Composable
private fun ConnectedActions(
    state: ConnectionUiState,
    onMessageChanged: (String) -> Unit,
    onSendPing: () -> Unit,
    onSendMessage: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = "Actions de test", fontWeight = FontWeight.SemiBold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onSendPing) { Text("Send Ping") }
            }
            OutlinedTextField(
                value = state.messageInput,
                onValueChange = onMessageChanged,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Message") }
            )
            Button(onClick = onSendMessage) {
                Text("Envoyer MSG")
            }
        }
    }
}

@Composable
private fun EventLog(events: List<String>) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(text = "Journal", fontWeight = FontWeight.SemiBold)
            HorizontalDivider()
            if (events.isEmpty()) {
                Text(text = "Aucun evenement pour l'instant.", style = MaterialTheme.typography.bodySmall)
            } else {
                events.forEach { event ->
                    Text(text = event, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}
