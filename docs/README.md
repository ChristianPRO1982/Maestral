# Documentation Structure — Maestral V1

This folder contains the authoritative documentation used to guide development.

Each file has a clearly defined responsibility.
No file should duplicate another.

---

## Root Documents

### TECH_STACK_V1.md

Defines the selected technologies and architectural decisions.
Explains **why** specific tools and approaches are used.

---

### PRODUCT_SPEC_V1.md

Functional specification from the user perspective.
Defines **what the product does** and expected behaviors.

Authoritative source for:

* User workflows
* Feature rules
* Role behavior (Master / Slave)

---

### SYNC_ENGINE_V1.md

Technical specification of peer-to-peer synchronization.
Defines:

* WebRTC pairing flow
* Message protocol
* State machine
* Reconnection logic

Authoritative source for device communication.

---

### UI_ARCHITECTURE_V1.md

Frontend implementation architecture.
Defines:

* Component structure
* State management
* Rendering lifecycle
* Interaction boundaries

Authoritative source for UI implementation decisions.

---

### DB_SCHEMA.md

Defines client-side data storage structure.

Includes:

* IndexedDB schema
* Versioning strategy
* Data models
* Migration rules

SQL migration files are located in:

```
./db/migrations/sql/
```

Each migration must increment version numbers and remain immutable once committed.

---

## Sprints

Located in:

```
./docs/sprints/
```

Each sprint file defines:

* Development scope
* Implementation steps
* Validation criteria

Sprint documents must not redefine architecture.
They only reference root documents.

---

## Documentation Rules

* Root documents define architecture.
* Sprint documents define implementation steps.
* No duplication between files.
* Architectural changes require updating the relevant root document.
