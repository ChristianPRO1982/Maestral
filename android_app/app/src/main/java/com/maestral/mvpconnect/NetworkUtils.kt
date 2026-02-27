package com.maestral.mvpconnect

import java.net.NetworkInterface
import java.util.Collections

object NetworkUtils {
    fun getLocalIpv4Addresses(): List<String> {
        val result = mutableListOf<String>()
        val interfaces = runCatching { Collections.list(NetworkInterface.getNetworkInterfaces()) }
            .getOrDefault(emptyList())

        for (network in interfaces) {
            if (!network.isUp || network.isLoopback || network.isVirtual) continue
            val addresses = Collections.list(network.inetAddresses)
            for (address in addresses) {
                val host = address.hostAddress ?: continue
                if (address.isLoopbackAddress) continue
                if (host.contains(":")) continue
                result.add("${network.displayName}: $host")
            }
        }

        return result.distinct().sorted().ifEmpty {
            listOf("Aucune IPv4 LAN detectee")
        }
    }
}
