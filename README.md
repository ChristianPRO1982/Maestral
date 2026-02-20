# Maestral

[![CI (dev)](https://github.com/ChristianPRO1982/Maestral/actions/workflows/dev_CI.yml/badge.svg?branch=dev)](https://github.com/ChristianPRO1982/Maestral/actions/workflows/dev_CI.yml)
[![License](https://img.shields.io/github/license/ChristianPRO1982/Maestral)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/ChristianPRO1982/Maestral)](https://github.com/ChristianPRO1982/Maestral/commits)
[![Issues](https://img.shields.io/github/issues/ChristianPRO1982/Maestral)](https://github.com/ChristianPRO1982/Maestral/issues)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebRTC](https://img.shields.io/badge/WebRTC-DataChannel-333333?logo=webrtc&logoColor=white)](https://webrtc.org/)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Local%20Storage-00599C)](https://developer.mozilla.org/docs/Web/API/IndexedDB_API)

> *Where voices move as one.*

# SOLO MODE

![Solo Mode](./docs/ChatGPT-solo_mode.png)

Image generate by IA.

# MASTER MODE

![Master Mode 1](./docs/ChatGPT-Master_mode_1.png) ![Master Mode 2](./docs/ChatGPT-Master_mode_2.png)

Image generate by IA.

## English

### Project Overview

Maestral is a digital music stand application for choirs and musicians.  
It focuses on synchronized score reading across devices with a minimal UI built for live performance.

### What It Does (V1)

- Imports songs as PDF, JPG, or PNG files.
- Organizes songs into setlists for rehearsal or performance flow.
- Supports discrete page navigation (page-by-page, no continuous score scroll).
- Provides **Solo Mode** for one or two devices (open-book behavior on dual screens).
- Provides **Choir Mode** with a **Master** controlling session/song state and **Followers** in Follow or Free mode.
- Prioritizes stable reconnection and predictable behavior during network disruptions.

### Product Direction

Maestral is designed for reliability and focus:

- Fast page turns and stable synchronization during performance.
- No PDF editing or score authoring.
- No cloud account dependency in V1.

### Documentation

Primary product source:

- `docs/PRODUCT_SPEC_V1.md`

Documentation map:

- `docs/README.md`

Architecture and implementation details are documented in `docs/` and the [project wiki](https://github.com/ChristianPRO1982/Maestral/wiki).

## Français

### Vue d'ensemble du projet

Maestral est une application de pupitre numérique pour chorales et musiciens.  
Son objectif est d'offrir une lecture de partitions synchronisée entre appareils, avec une interface minimale pensée pour la scène.

### Ce que fait le produit (V1)

- Import de morceaux au format PDF, JPG ou PNG.
- Organisation des morceaux en setlists pour répétition et performance.
- Navigation discrète page par page (pas de défilement continu entre pages).
- **Mode Solo** sur un ou deux appareils (comportement "livre ouvert" en double écran).
- **Mode Chorale** avec un **Master** qui pilote la session/le morceau et des **Followers** en mode Suivi ou Libre.
- Priorité à la reconnexion stable et au comportement prévisible en cas de coupure.

### Direction produit

Maestral est conçu pour la fiabilité et la concentration musicale :

- Changements de page rapides et synchronisation stable en situation de performance.
- Pas d'édition de PDF ni d'outil d'écriture de partition.
- Pas de dépendance à un compte cloud en V1.

### Documentation

Source produit principale :

- `docs/PRODUCT_SPEC_V1.md`

Plan de documentation :

- `docs/README.md`

Les détails d'architecture et d'implémentation sont dans `docs/` et dans le [wiki du projet](https://github.com/ChristianPRO1982/Maestral/wiki).
