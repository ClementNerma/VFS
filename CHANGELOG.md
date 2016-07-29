Fr 29-07-2016
Version 1.3-a
- Fixed a bug : `Object.keys()` was used on objects, which will returns some non-own properties

Fr 29-07-2016
Version 1.3
- Adapted to ES6 syntax [Improved performance a little]
- Fixed a bug with CWD during absolute path normalization
- Fixed a bug with absolute path normalization (using the default separator instead of the current)
- Fixed a bug with @import which was not doing a right validation

Tu 26-07-2016
Version 1.2
- Added support for CWD and @chdir
- Added support for custom separator (default: '/')
- Added import & export features

Su 24-07-2016
Version 1.1
- Items can't take an object-reserved name anymore
- Added @into, @appendFile, @touchFile,  @readJSON, @copyFile, @moveFile, @hasSubFolders, @importFolder, @exportFolder

Sa 23-07-2016
Version 1.0
- Support of files & folders
- Support of files table
- Support of security agent
- Support of lock mode
- Support of forbidden characters & strict forbid mode
- Web pages for benchmark + Unit Tests Suite
