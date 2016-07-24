'use strict';

let storage = new VFS();

UnitTest.load(function(describe, it, assert) {
  describe('Test files &amp; folders', () => {
    it('test tools', () => {
      assert(storage.normalize('/'), '', 'Failed to normalize the root symbol');
      assert(storage.normalize(''), '', 'Failed to normalize an empty path');
      assert(storage.normalize(), '', 'Failed to normalize an undefined path');
      assert(storage.normalize('/test//'), 'test', 'Failed to normalize a complex path');

      assert(storage.into('sub'), true, 'Item not recognized as a child of root');
      assert(storage.into('sub', 'sub'), true, 'Item not recognized as equal to itself');
      assert(storage.into('sub/under', 'sub'), true, 'Item not recognized as a child of its parent');
      assert(storage.into('sub', 'sub/under'), false, 'Parent recognized as a child of itself');
    });

    it('test existence functions', () => {
      assert(storage.exists('hello'), false, 'Inexistant item dectected as existant');
      assert(storage.exists('.'), true, 'Local folder "." detected as inexistant');
      assert(storage.dirExists('.'), true, 'Local folder "." not recognized as a folder');
      assert(storage.fileExists('.'), false, 'Local folder "." recognized as a file');
      assert(storage.dirExists('..'), true, 'Local folder ".." detected as inexistant');
    });

    it('test folders writing', () => {
      assert(storage.makeDir('doc'), true, 'Failed to make folder');
      assert(storage.makeDir('doc'), false, 'Allowed to make an already existing folder');
      assert(storage.makeDir('tmp'), true, 'Failed to make folder');
      assert(storage.makeDir('.'), false, 'Allowed to remake a system folder');
    });

    it('test files writing', () => {
      assert(storage.writeFile('hello.txt', 'hello'), true, 'Failed to write a file');
      assert(storage.writeFile('hello.txt', null), false, 'Allowed to write file with a non-string content');
      assert(storage.writeFile('json.txt', '{"state":"good"}'), true, 'Failed to write a file');
      assert(storage.writeFile('.', 'hello'), false, 'Allowed to write folder "." as a file');

      assert(storage.writeFile('doc', 'hello'), false, 'Allowed to write a folder as file');
      assert(storage.writeFile('doc/test.txt', 'hello'), true, 'Failed to write a file into a sub-folder');
      assert(storage.appendFile('doc/test.txt', 'hey'), true, 'Failed to append a file into a sub-folder');
      assert(storage.touchFile('doc/a.txt'), true, 'Failed to create an empty file');

      assert(storage.appendFile('doc/b.txt', 'hey'), true, 'Failed to append a content to a non-existant file');
    });

    it('test files reading', () => {
      assert(storage.readFile('hello.txt'), 'hello', 'Failed to read file');
      assert(storage.readFile('.'), false, 'Allowed to read folder "." as a file');

      assert(storage.readFile('doc'), false, 'Allowed to read a folder as a file');
      assert(storage.readFile('doc/test.txt'), 'hello\nhey', 'Failed to read a file into a sub-folder');
      assert(storage.readFile('doc/b.txt'), 'hey', 'Failed to read a file into a sub-folder [may be caused by @appendFile]');

      let json = storage.readJSON('json.txt');

      assert(typeof json, 'object', 'Failed to read a file as JSON');
      assert(json.state, 'good', 'JSON reading returned bad data');
      assert(storage.readJSON('hello.txt'), false, 'Allowed to read a non-JSON file as JSON data');
    });

    it('test files copying & moving', () => {
      assert(storage.copyFile('hello.txt', 'hey.txt'), true, 'Failed to copy a file');
      assert(storage.copyFile('hello.txt', 'hey.txt'), false, 'Allowed to copy a file to an existing location');
      assert(storage.readFile('hello.txt'), storage.readFile('hey.txt'), 'Source and destination file have different contents');

      assert(storage.moveFile('hey.txt', '_hey.txt'), true, 'Failed to move a file');
      assert(storage.moveFile('_hey.txt', 'hello.txt'), false, 'Allowed to move a file to an existing location');
      assert(storage.readFile('_hey.txt'), 'hello', 'File moving written bad data');
      assert(storage.exists('hey.txt'), false, 'Source of moved item detected as existant');
      assert(storage.fileExists('_hey.txt'), true, 'Destination of moved item detected as inexistant');
    });

    it('test files removing', () => {
      assert(storage.removeFile('hello.txt'), true, 'Failed to remove a file into a sub-folder');
      assert(storage.exists('hello.txt'), false, 'Removed file detected as existant item');
    });

    it('test existence functions', () => {
      assert(storage.exists('doc'), true, 'Folder detected as inexistant item');
      assert(storage.dirExists('doc'), true, 'Folder detected as inexistant');
      assert(storage.fileExists('doc'), false, 'Folder detected as a file');

      assert(storage.exists('doc/test.txt'), true, 'File detected as inexistant item (into a sub-folder)');
      assert(storage.fileExists('doc/test.txt'), true, 'File detected as inexistant (into a sub-folder)');
      assert(storage.dirExists('doc/test.txt'), false, 'File detected as a folder (into a sub-folder)');

      assert(storage.hasSubFolders('/'), true, 'No sub-folders detected for root');
      assert(storage.hasSubFolders('doc'), false, 'Sub-folders detected in a folder that doesn\'t contain one');
    });

    it('test folders reading', () => {
      let read = storage.readDir('doc');

      assert(Array.isArray(read), true, 'Failed to read a sub-folder');
      assert(read[0], 'test.txt', 'Wrong data from sub-folder reading');

      let tree = storage.getTree('/');

      assert(typeof tree, 'object', 'Failed to read a sub-folder as a tree');
      assert(typeof tree['doc'], 'object', 'Wrong data from root folder tree [Folder not found]');
      assert(tree['doc']['test.txt'], 'hello\nhey', 'Wrong data from root folder tree [Bad file]')
    });

    it('test folders import & export', () => {
      let exp = storage.exportFolder('doc');

      assert(typeof exp, 'object', 'Failed to export a folder ["doc"]');
      assert(exp.folder['test.txt'], 'hello\nhey', 'Folder export returned bad data');

      assert(storage.importFolder(exp), false, 'Allowed to import a folder to an existing location');
      assert(storage.importFolder(exp, undefined, true), true, 'Failed to import a folder to an existing location [with "force" parameter]');
      assert(storage.dirExists('doc'), true, 'Import failed to make the "doc" folder');
      assert(storage.importFolder(exp, '...'), true, 'Failed to import a folder to a custom location');
      assert(storage.dirExists('...'), true, 'Import failed to make the "..." folder');
    });

    it('test folders removing', () => {
      assert(storage.removeTree('tmp'), true, 'Failed to remove an empty folder');
      assert(storage.removeTree('tmp'), false, 'Allowed to remove an already-deleted folder');
      assert(storage.removeTree('inexistant'), false, 'Allowed to remove an inexistant folder');
      assert(storage.removeTree('hello.txt'), false, 'Allowed to remove a file as a folder');
      assert(storage.removeTree('doc'), false, 'Allowed to remove an non-empty folder without the "recursive" parameter');
      assert(storage.removeTree('doc', true), true, 'Failed to remove a non-empty folder ["recursive" parameter specified]');
    });
  });

  describe('Test advanced features', () => {
    it('test flags', () => {
      assert(storage.makeDir('tmp'), true, 'Failed to make a temp folder ["tmp"]');
      assert(storage.makeDir('doc'), true, 'Failed to make a temp folder ["doc"]');
      assert(storage.writeFile('hello.txt', 'hello'), true, 'Failed to write a temp file ["hello.txt"]');
      assert(storage.writeFile('doc/test.txt', 'hello'), true, 'Failed to write a temp file ["doc/test.txt"]');

      assert(storage.hasFlag('hello.txt', 'r'), false, 'Flag "r" detected but never set');
      assert(storage.readDir('/').indexOf('hello.txt') !== -1, true, 'File not listed in directory\'s content');
      assert(storage.addFlag('hello.txt', 'h'), true, 'Failed to add flag "h" to a file');
      assert(storage.readDir('/').indexOf('hello.txt') === -1, true, '"h" flag doesn\'t work on a file');
      assert(storage.readDir('/', true).indexOf('hello.txt') !== -1, true, 'Invisible file is not visible in directory listing even if the "showHidden" parameter is specified')
      assert(storage.removeFlag('hello.txt', 'h'), true, 'Failed to remove flag "h" to a file');
      assert(storage.readDir('/').indexOf('hello.txt') !== -1, true, 'File not listed in directory\'s content');
      assert(storage.hasFlag('hello.txt', 'h'), false, 'Flag "h" detected after removing');
      assert(storage.addFlag('hello.txt', 'r'), true, 'Failed to add flag "r" to a file');
      assert(storage.hasFlag('hello.txt', 'r'), true, 'Flag "r" not detected on a file');
      assert(storage.writeFile('hello.txt', 'hello2'), false, 'Allowed to write a read-only file');
      assert(storage.addFlag('hello.txt', 'u'), true, 'Failed to add flag "u" to a file');
      assert(storage.removeFile('hello.txt'), false, 'Allowed to delete an undeletable file');
      assert(storage.getFlags('hello.txt'), 'ru', 'Flags "r" and/or "u" not detected on a file');
      assert(storage.removeFlag('hello.txt', 'ru'), true, 'Failed to remove flags "r" and "u" to a file');
      assert(storage.writeFile('hello.txt', 'hello2'), true, 'Failed to write a file after "r" flag removing');
      assert(storage.removeFile('hello.txt'), true, 'Failed to remove a file after "u" flag removing');
    });

    it('test files table', () => {
      // The file is created, the creation date should be set
      assert(storage.writeFile('hello.txt', 'hello'), true, 'Failed to write a temp file ["hello.txt"]');

      let instant = Date.now();
      while(instant === Date.now()) { ; } // Wait for a milisecond (min.)

      // Because a milisecond passed, the writing we'll do will set a different date to the writing date
      assert(storage.writeFile('hello.txt', 'hello'), true, 'Failed to write a temp file ["hello.txt"]');

      let itemTable = storage.getTableEntry('hello.txt');

      assert(itemTable !== false, true, 'Failed to get a file table');
      assert(itemTable[0] !== itemTable[1], true, 'Writing date has not been updated');
      assert(itemTable[2], '', 'Flags found on a file after flags removing');
    });

    it('test forbidden characters', () => {
      assert(storage.writeFile('hello<>', 'hello'), false, 'Allowed to use filename with forbidden chars ["<" / ">"]');
      assert(storage.unforbid('<'), true, 'Failed to unforbid "<" char');
      assert(storage.unforbid('>'), true, 'Failed to unforbid ">" char');
      assert(storage.writeFile('hello<>', 'hello'), true, 'Failed to write file with unforbidden chars ["<" / ">"]');
      assert(storage.isForbidden('<'), false, 'Unforbidden char detected as forbidden (after unforbid usage)');
      assert(storage.isForbidden('.'), false, 'Unforbidden char detected as forbidden');
      assert(storage.isForbidden('|'), true, 'Forbidden char not detected as forbidden');
      assert(storage.forbid('h'), true, 'Failed to forbid "h" char');
      assert(storage.writeFile('hello.txt', 'hello'), false, 'Allowed to use filename with forbidden chars ["h"]');

      assert(storage.isStrictForbid(), false, 'Strict forbid mode is enabled by default');
      assert(storage.readFile('hello<>'), 'hello', 'Failed to read file with forbidden chars in non-strict forbid mode');
      storage.enableStrictForbid();
      assert(storage.isStrictForbid(), true, 'Strict forbid mode not detected as enabled');
      assert(storage.readFile('hello<>'), false, 'Allowed to read file with forbidden chars in strict forbid mode');
      storage.disableStrictForbid();
      assert(storage.isStrictForbid(), false, 'Strict forbid mode not detected as disabled');
    });
  });

  describe('Test VFS security', () => {
    it('test instance security', () => {
      try {
          storage.___ = 'issue';
      } catch(e) {}

      assert(typeof storage.___, 'undefined', 'VFS instance can be modified !');

      let clone = storage;

      try {
        clone.___ = 'issue';
      } catch(e) {}

      assert(typeof storage.___, 'undefined', 'Clone of a VFS instance can be modified !');
    });

    it('test lock mode', () => {
      assert(storage.isLocked(), false, 'Lock mode detected by default');
      storage.lock();
      assert(storage.isLocked(), true, 'Lock mode not detected');
      assert(storage.forbid('f'), false, 'Allowed to forbid characters in lock mode');
    });

    it('test security agent', () => {
      /**
        * Security agent
        * @param {string} request
        * @param {string} path
        * @param {string} [add]
        * @return {void|boolean} Void or 'false'
        */
      function agent(request, path, add) {
        if(denyRequests)
          return false;

        if(request === 'file/write' && disableFileWriting)
          return false;

        if(request === 'agent/exist' && hideAgent)
          return false;
      }

      // Create a new VFS instance for work
      /** @type {VFS} */
      let storage = new VFS(agent);

      // Disable file writing
      /** @type {boolean} */
      let disableFileWriting = false;

      // Deny all requests
      /** @type {boolean} */
      let denyRequests = false;

      // Hide agent from outside
      /** @type {boolean} */
      let hideAgent = false;

      assert(storage.isAgent(), true, 'Agent not detected');
      assert(storage.writeFile('hello.txt', 'hello'), true, 'Failed to write a file');
      assert(storage.fileExists('hello.txt'), true, 'File not detected as existant');
      disableFileWriting = true;
      assert(storage.writeFile('hello.txt', 'hello'), false, 'Security agent can\'t deny "file/write" request');
      hideAgent = true;
      assert(storage.isAgent(), false, 'Security agent can\'t hide himself [deny "agent/exist"] request');
      denyRequests = true;
      assert(storage.exists('hello.txt'), false, 'Security agent can\'t deny requests');
    });
  });
});
