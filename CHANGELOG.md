# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Changelog
- Support for Firebase Messaging (Admin API)

### Changed
- `MockStorageFile.download()` now allows omitting the destination arg;
  in that case, it simply resolves the `Promise` with the file contents
  and does not write it anywhere else.

### Fixed
- `onAuthStateChanged` now correctly calls its callback immediately with
  the current auth state.  
- `MockStorage.bucket()` and `MockStorageBucket.file()` now return the
  existing artifact if one exists, rather than overwriting it with a new
  one.
- `DataSnapshot.child` now correctly splits child paths by '/'
  characters


[Unreleased]: https://github.com/dmurvihill/firebase-mock/compare/v2.2.10...HEAD
