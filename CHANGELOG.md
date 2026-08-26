# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-08-26

### Added

- Searchable local archive for up to 50 incident reports.
- Incident duplication, switching, and guarded deletion.
- Complete archive import and export with identifier-based merging.
- Automatic migration from the version 1 single-incident storage key.

### Changed

- Imported JSON now accepts either one incident or a version 2 archive bundle.
- Persistence tests cover migration, merging, archive bounds, and unique identifiers.

## [1.0.0] - 2026-08-26

### Added

- Editable incident metadata, response window, impact, timeline, and analysis.
- Detection-time, recovery-time, and follow-up completion metrics.
- Owner, due date, and status tracking for remediation work.
- Versioned local persistence with validated JSON import.
- Markdown, JSON, and print exports.
- Responsive, accessible incident dossier interface.
- Automated unit, interaction, build, and deployment workflows.

[1.0.0]: https://github.com/kyan9400/incident-canvas/releases/tag/v1.0.0
[1.1.0]: https://github.com/kyan9400/incident-canvas/releases/tag/v1.1.0
