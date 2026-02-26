package com.maestral.mvpconnect

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import java.io.BufferedReader
import java.io.PrintWriter
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import kotlin.random.Random
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private const val DEFAULT_PORT = "8989"

enum class ConnectionRole {
    NONE,
    HOST,
    JOIN
}

enum class ConnectionStatus {
    IDLE,
    HOSTING,
    JOINING,
    CONNECTED,
    ERROR
}

data class ConnectionUiState(
    val role: ConnectionRole = ConnectionRole.NONE,
    val hostAddressInput: String = "",
    val portInput: String = DEFAULT_PORT,
    val tokenInput: String = "",
    val messageInput: String = "Salut depuis Maestral MVP",
    val generatedToken: String = "",
    val localIps: List<String> = emptyList(),
    val status: ConnectionStatus = ConnectionStatus.IDLE,
    val statusMessage: String = "Choisis Host ou Join pour commencer.",
    val peerEndpoint: String = "",
    val lastMessage: String = "",
    val errorMessage: String? = null,
    val events: List<String> = emptyList()
)

class ConnectionViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ConnectionUiState())
    val uiState: StateFlow<ConnectionUiState> = _uiState.asStateFlow()

    private var sessionJob: Job? = null
    private var socket: Socket? = null
    private var serverSocket: ServerSocket? = null
    private var writer: PrintWriter? = null

    @Volatile
    private var manualStopRequested = false

    fun selectHost() {
        manualStopRequested = true
        closeTransport()
        val token = generateToken()
        _uiState.value = ConnectionUiState(
            role = ConnectionRole.HOST,
            portInput = DEFAULT_PORT,
            tokenInput = token,
            generatedToken = token,
            localIps = NetworkUtils.getLocalIpv4Addresses(),
            status = ConnectionStatus.IDLE,
            statusMessage = "Mode Host pret. Demarre l'ecoute.",
            events = listOf(eventLine("Mode Host active."))
        )
    }

    fun selectJoin() {
        manualStopRequested = true
        closeTransport()
        _uiState.value = ConnectionUiState(
            role = ConnectionRole.JOIN,
            portInput = DEFAULT_PORT,
            status = ConnectionStatus.IDLE,
            statusMessage = "Mode Join pret. Renseigne IP + token.",
            events = listOf(eventLine("Mode Join active."))
        )
    }

    fun updateHostAddress(value: String) {
        _uiState.update { it.copy(hostAddressInput = value.trim()) }
    }

    fun updatePort(value: String) {
        val digits = value.filter { ch -> ch.isDigit() }
        _uiState.update { it.copy(portInput = digits) }
    }

    fun updateToken(value: String) {
        _uiState.update { it.copy(tokenInput = value.trim()) }
    }

    fun updateMessage(value: String) {
        _uiState.update { it.copy(messageInput = value) }
    }

    fun regenerateToken() {
        if (_uiState.value.role != ConnectionRole.HOST) return
        val token = generateToken()
        _uiState.update { it.copy(tokenInput = token, generatedToken = token) }
        addEvent("Nouveau token genere: $token")
    }

    fun refreshLocalIps() {
        if (_uiState.value.role != ConnectionRole.HOST) return
        _uiState.update { it.copy(localIps = NetworkUtils.getLocalIpv4Addresses()) }
        addEvent("Liste d'IP locales rafraichie.")
    }

    fun startHost() {
        val snapshot = _uiState.value
        if (snapshot.role != ConnectionRole.HOST) return

        val port = snapshot.portInput.toIntOrNull()
        if (port == null || port <= 0 || port > 65535) {
            setError("Port invalide. Utilise une valeur entre 1 et 65535.")
            return
        }

        val token = snapshot.tokenInput.ifBlank { generateToken() }
        _uiState.update { it.copy(tokenInput = token, generatedToken = token) }

        manualStopRequested = false
        closeTransport()
        _uiState.update {
            it.copy(
                status = ConnectionStatus.HOSTING,
                statusMessage = "En attente d'un client sur le port $port...",
                errorMessage = null,
                peerEndpoint = ""
            )
        }
        addEvent("Host en ecoute sur port $port avec token $token.")

        sessionJob = viewModelScope.launch(Dispatchers.IO) {
            try {
                val localServer = ServerSocket()
                localServer.reuseAddress = true
                localServer.bind(InetSocketAddress(port))
                serverSocket = localServer

                val acceptedSocket = localServer.accept()
                val peer = "${acceptedSocket.inetAddress.hostAddress}:${acceptedSocket.port}"
                val reader = acceptedSocket.getInputStream().bufferedReader()
                val output = PrintWriter(acceptedSocket.getOutputStream(), true)
                val hello = reader.readLine()

                if (hello != "HELLO $token") {
                    output.println("ERROR TOKEN")
                    acceptedSocket.close()
                    setError("Connexion rejetee: token incorrect.")
                    addEvent("Tentative rejetee depuis $peer (token invalide).")
                    return@launch
                }

                output.println("OK")
                socket = acceptedSocket
                writer = output
                _uiState.update {
                    it.copy(
                        status = ConnectionStatus.CONNECTED,
                        statusMessage = "Connecte a $peer",
                        peerEndpoint = peer,
                        errorMessage = null
                    )
                }
                addEvent("Connexion acceptee avec $peer.")
                readIncomingMessages(reader, output)
            } catch (error: Throwable) {
                if (!isExpectedTermination(error)) {
                    setError("Erreur Host: ${error.message ?: "inconnue"}")
                }
            } finally {
                val endedByStop = manualStopRequested
                closeTransport()
                if (!endedByStop && _uiState.value.role == ConnectionRole.HOST) {
                    _uiState.update {
                        it.copy(
                            status = ConnectionStatus.IDLE,
                            statusMessage = "Connexion terminee. Tu peux relancer l'ecoute.",
                            peerEndpoint = ""
                        )
                    }
                }
            }
        }
    }

    fun joinHost() {
        val snapshot = _uiState.value
        if (snapshot.role != ConnectionRole.JOIN) return

        val port = snapshot.portInput.toIntOrNull()
        if (port == null || port <= 0 || port > 65535) {
            setError("Port invalide. Utilise une valeur entre 1 et 65535.")
            return
        }
        if (snapshot.hostAddressInput.isBlank()) {
            setError("Adresse Host requise.")
            return
        }
        if (snapshot.tokenInput.isBlank()) {
            setError("Token requis.")
            return
        }

        manualStopRequested = false
        closeTransport()
        _uiState.update {
            it.copy(
                status = ConnectionStatus.JOINING,
                statusMessage = "Connexion a ${snapshot.hostAddressInput}:$port...",
                errorMessage = null,
                peerEndpoint = ""
            )
        }
        addEvent("Tentative de connexion vers ${snapshot.hostAddressInput}:$port.")

        sessionJob = viewModelScope.launch(Dispatchers.IO) {
            try {
                val client = Socket()
                client.connect(InetSocketAddress(snapshot.hostAddressInput, port), 5_000)
                val reader = client.getInputStream().bufferedReader()
                val output = PrintWriter(client.getOutputStream(), true)
                output.println("HELLO ${snapshot.tokenInput}")
                val response = reader.readLine()

                if (response != "OK") {
                    client.close()
                    setError("Connexion refusee par le Host (token ou protocole).")
                    addEvent("Connexion refusee, reponse: ${response ?: "vide"}.")
                    return@launch
                }

                val peer = "${client.inetAddress.hostAddress}:${client.port}"
                socket = client
                writer = output
                _uiState.update {
                    it.copy(
                        status = ConnectionStatus.CONNECTED,
                        statusMessage = "Connecte a $peer",
                        peerEndpoint = peer,
                        errorMessage = null
                    )
                }
                addEvent("Connexion etablie avec $peer.")
                readIncomingMessages(reader, output)
            } catch (error: Throwable) {
                if (!isExpectedTermination(error)) {
                    setError("Erreur Join: ${error.message ?: "inconnue"}")
                }
            } finally {
                val endedByStop = manualStopRequested
                closeTransport()
                if (!endedByStop && _uiState.value.role == ConnectionRole.JOIN) {
                    _uiState.update {
                        it.copy(
                            status = ConnectionStatus.IDLE,
                            statusMessage = "Connexion terminee. Tu peux relancer Join.",
                            peerEndpoint = ""
                        )
                    }
                }
            }
        }
    }

    fun sendPing() {
        val output = writer
        if (output == null || _uiState.value.status != ConnectionStatus.CONNECTED) {
            setError("Aucune connexion active.")
            return
        }
        val payload = "PING ${System.currentTimeMillis()}"
        output.println(payload)
        addEvent("Envoye: $payload")
    }

    fun sendMessage() {
        val output = writer
        val text = _uiState.value.messageInput.trim()
        if (output == null || _uiState.value.status != ConnectionStatus.CONNECTED) {
            setError("Aucune connexion active.")
            return
        }
        if (text.isBlank()) return
        output.println("MSG $text")
        addEvent("Envoye: MSG $text")
    }

    fun stopSession() {
        manualStopRequested = true
        closeTransport()
        _uiState.update {
            it.copy(
                status = ConnectionStatus.IDLE,
                statusMessage = "Session arretee.",
                peerEndpoint = "",
                errorMessage = null
            )
        }
        addEvent("Session arretee manuellement.")
    }

    override fun onCleared() {
        manualStopRequested = true
        closeTransport()
        super.onCleared()
    }

    private fun readIncomingMessages(reader: BufferedReader, output: PrintWriter) {
        while (true) {
            val line = reader.readLine() ?: break
            addEvent("Recu: $line")
            if (line.startsWith("PING ")) {
                output.println("PONG ${System.currentTimeMillis()}")
                addEvent("Envoye: PONG")
            }
        }
    }

    private fun setError(message: String) {
        _uiState.update {
            it.copy(
                status = ConnectionStatus.ERROR,
                statusMessage = "Erreur",
                errorMessage = message
            )
        }
        addEvent("Erreur: $message")
    }

    private fun addEvent(message: String) {
        _uiState.update { state ->
            state.copy(
                lastMessage = message,
                events = (listOf(eventLine(message)) + state.events).take(30)
            )
        }
    }

    private fun closeTransport() {
        sessionJob?.cancel()
        sessionJob = null

        runCatching { writer?.flush() }
        runCatching { writer?.close() }
        writer = null

        runCatching { socket?.close() }
        socket = null

        runCatching { serverSocket?.close() }
        serverSocket = null
    }

    private fun isExpectedTermination(error: Throwable): Boolean {
        return error is CancellationException ||
            (error is SocketException && error.message?.contains("Socket closed", ignoreCase = true) == true)
    }

    private fun generateToken(): String {
        return Random.nextInt(100_000, 999_999).toString()
    }

    private fun eventLine(message: String): String {
        val time = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))
        return "[$time] $message"
    }
}
