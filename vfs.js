// Observation notes :
// The Virtual FileSystem cannot be used for large virtual storages, due to all files and folders are stored in the RAM
// If storage has too many data, interpreter will throws a fatal error due to RAM exceed. The limit depends of the computer's RAM.
// The better would be to write all files in a temporary subfolder (all writing requests (and reading if needed) would be adressed not the root but to a subfolder)
// The VFS solution is only interesting if a totally virtual filesystem is needed, or if there is no way to write to the disk (e.g. into a browser)
// NOTE: This module can also be used via an interface which have the same functions that Node.JS.

// Flags for the FST (File System Table) :
// 'h' : hidden
// 'r' : read-only   (NOTE: This flag is ignored if a parent folder is deleted)
// 'u' : undeletable (NOTE: This flag is ignored if a parent folder is deleted)

'use strict';

/**
  * VFS class
  * @constructor
  * @param {function} [securityAgent]
  */
const VFS = function(securityAgent) {

  let _storage = {},
      _table   = {},
      _forbiddenChars        = ':*?<>|',
      _readOnlyIsUndeletable = true,  // If true, when you add the 'r' flag the file is undeletable (excepted if the parent folder is deleted)
      _strictCharsForbid     = false, // If true, all request with a path containing forbidden characters will fail. If false, only 'write' requests will fail (default: false)
      _agent  = securityAgent || false, // Security agent
      _locked = false; // If true, parameters will not be changeable again

  /**
    * Perform an action on the filesystem
    * @param {string} path If this is the only argument, function will return if the path's content (the path will be normalized)
    * @param {string} [type] Expected content type ("string" for files, "object" for folders)
    * @param {string|object} [write] Content to write (if it's not a string or an object, the request will fail)
    * @param {boolean} [deleteIt] Delete the item
    * @return {boolean} true on success, false on fail
    */
  function _fs(path, type, write, deleteIt) {
    // Normalize and get an array, permit to don't have to split the array next
    path = _normalize(path, true);

    // Get the full normalized path as a single string
    let joined = path.join('/');

    // Check for forbidden characters only if the request is writing
    // ...or if the program is in 'strict' forbid
    if((write && write.length) || _strictCharsForbid) {
      // Fail if the path contains forbidden chars
      for(let i = 0; i < _forbiddenChars.length; i++) {
        if(joined.indexOf(_forbiddenChars[i]) !== -1)
          return false;
      }
    }

    // If 'path' is the root
    if(!path.length) {
      // Return true if path is the only argument, false if trying to write or delete the path (because you can't write a folder and can't delete the root)
      return ((typeof write === 'undefined' && !deleteIt) && (!type || type === 'object')) ? _storage : false;
    }

    // If write is defined but that's not a string : that's a bad argument, the request fails
    if(typeof write !== 'undefined' && typeof write !== 'string' && (typeof write !== 'object' || Array.isArray(write) || !write))
      return false;

    let _s = _storage;

    // For each folder in the path (excepted the last item, file or folder)
    for(let i = 0; i < path.length - 1; i++) {
      // Fail if the folder doesn't exist
      if(!_s.hasOwnProperty(path[i]))
        return false;

      _s = _s[path[i]];
    }

    // Get the last part of the path (after the last '/')
    let last = path[path.length - 1];

    // Fail if the item's type is not the expected type
    if(type && typeof _s[last] !== 'undefined' && typeof _s[last] !== type)
      return false;

    // If the request is 'exist'
    if(typeof write === 'undefined' && !deleteIt)
      // Check if the path exists
      return _s.hasOwnProperty(last) ? _s[last] : false;

    // If the request is 'write'
    if(!deleteIt) { // By elimination, this is faster than (typeof write !== 'undefined')
      // If that's the first writing of this path...
      if(!_table[joined])
        _table[joined] = [ Date.now() /* Creation date */, Date.now() /* Last writing date */ , '' /* flags */];
      // ... else, if the file is read-only and 'r' flags set to 'undeletable' OR if the file is undeletable, the request fails
      else if(_table[joined][2].indexOf('u') !== -1 || (_table[joined][2].indexOf('r') !== -1 && _readOnlyIsUndeletable))
        return false;
      // ... else just update the last writing date
      else
        _table[joined][1] = Date.now();

      // Then write the data
      _s[last] = write;

      // Success
      return true;
    }

    // If the request is 'delete' (the last possible)
    // There is no 'if' condition because we're sure that the request is 'delete'

    // Fail if the item doesn't exist
    if(!_s.hasOwnProperty(last))
      return false;

    // Else delete it on the table
    delete _table[joined];
    // And on the storage
    delete _s[last];
  }

  /**
    * Normalize a path
    * @param {string} path
    * @param {boolean} returnArray Returns an array instead of a string
    * @return {string|array} Normalized path
    */
  function _normalize(path, returnArray) {
    let out = [];

    // Split the path by seperators (here, slashes)
    // The '' part permit to work even if there is no path specified, else it would cause a fatal error
    path = (path || '').split('/');

    for(let i = 0; i < path.length; i++) {
      if(path[i] === '..')
        out.pop();
      else if(path[i] && path[i] !== '.')
        out.push(path[i]);
    }

    return returnArray ? out : out.join('/');
  }

  /**
    * Clone a value (only works with some kind of values)
    * @param {array|object} source
    * @return {array|object}
    */
  function _clone(source) {
    function recursive(source) {
      let keys = Object.keys(source), out = {};

      for(let i = 0; i < keys.length; i++)
        out[keys[i]] = (typeof source[keys[i]] === 'object' ? recursive(source[keys[i]]) : source[keys[i]]);
        /**if(typeof sub[keys[i]] === 'object')
          out[keys[i]] = recursive(source[keys[i]]);
        else
          out[keys[i]] = source[keys[i]];**/ // Unoptimized method

      return out;
    }

    return recursive(source);
  };

  /**
    * Send a request to agent
    * @param {string} request
    * @param {string} path
    * @return {boolean}
    */
  function agent(request, path) {
    return (_agent.apply(this, [request, _normalize(path)]) !== false);
  }

  /**
    * Check if a path exists
    * @param {string} path
    * @return {boolean} Exists
    */
  this.exists = function(path) {
    if(_agent && !agent('*/exist', path))
      return false;

    return this.fileExists(path) || this.dirExists(path);
  };

  /**
    * Check if a file exists
    * @param {string} path
    * @return {boolean} Exists
    */
  this.fileExists = function(path) {
    if(_agent && !agent('file/exist', path))
      return false;

    return !!_fs(path, 'string');
  };

  /**
    * Check if a folder exists
    * @param {string} path
    * @return {boolean} Exists
    */
  this.dirExists = function(path) {
    if(_agent && !agent('folder/exist', path))
      return false;

    return !!_fs(path, 'object');
  };

  /**
    * Make a folder
    * @param {string} path
    * @return {boolean} Success
    */
  this.makedir = function(path) {
    if(_agent && !agent('folder/make', path))
      return false;

    // Fail if the folder already exists
    if(this.dirExists(path))
      return false;

    // Contains the success of the writing request
    /** @type {boolean} */
    let ret = _fs(path, 'object', {});

    // If the writing has succeed, put an entry into the table
    // NOTE: A folder can only have the 'h' flag, just a creation date. The writing date is constant and equals to the creation date.
    if(ret)
      _table[path] = [ Date.now() /* Creation date */, Date.now() /* Writing date */, ''];

    // Success
    return ret;
  };

  /**
    * Delete a folder
    * @param {string} path
    * @param {boolean} recursive Delete the folder even if it contains items
    * @return {boolean} Success
    */
  this.removedir = function(path, recursive) {
    if(_agent && !agent('folder/remove', path))
      return false;

    let dir = _fs(path = _normalize(path), 'object');

    // Fail if the folder doesn't exist
    if(!dir)
      return false;

    // Fail if the folder isn't empty and the removing is not set as 'recursive'
    if(Object.keys(dir).length && !recursive)
      return false;

    function recurse(obj, path) {
      let keys = Object.keys(obj);

      for(let i = 0; i < keys.length; i++) {
        delete _table[path + '/' + keys[i]];

        if(typeof obj[keys[i]] === 'object')
          recurse(obj[keys[i]], path + '/' + keys[i]);
      }
    }

    // If the folder contains items, delete all the entries in the table associated to those items
    if(Object.keys(dir).length)
      recurse(dir, path);

    delete _table[path];

    // Delete the folder from its parent
    path = path.split('/');
    let last = path.pop();
    delete _fs(path.join('/'))[last];

    // Success !
    return true;
  };

  /**
    * List content of a folder
    * @param {string} path
    * @param {boolean} [showHidden] Show hidden items
    * @return {array|boolean} False if fails
    */
  this.readdir = function(path, showHidden) {
    if(_agent && !agent('folder/read', path))
      return false;

    let dir = _fs(path = _normalize(path), 'object');

    if(!dir)
      return false;

    let out = [], keys = Object.keys(dir), full;

    for(let i = 0; i < keys.length; i++) {
      if(showHidden || !(_table[full = path + (path.length ? '/' : '') + keys[i]] && _table[full][2].indexOf('h') !== -1))
        out.push(keys[i]);
    }

    return out;
  };

  /**
    * Write a file
    * @param {string} path
    * @param {string} content
    * @return {boolean} Success
    */
  this.writeFile = function(path, content) {
    if(_agent && !agent('file/write', path))
      return false;

    // Fail if the file is read-only
    if(_table[path = _normalize(path)] && _table[path][2].indexOf('r') !== -1)
      return false;

    return _fs(path, 'string', content);
  };

  /**
    * Append a content to a file
    * @param {string} path
    * @param {string} content
    * @param {boolean} [noNewLine] If true, no new line will be added to the file (default: false)
    * @return {boolean} Success
    */
  this.appendFile = function(path, noNewLine, content) {
    if(_agent && !agent('file/append', path))
      return false;

    // Fail if the file is read-only
    if(_table[path = _normalize(path)] && _table[path][2].indexOf('r') !== -1)
      return false;

    // Get the current file's content
    let str = _fs(path, 'string');

    // If the file doesn't exist, create it
    // NOTE: Here the '===' operator is used because the file's content can be an empty string (and '' == false in javascript)
    if(str === false)
      return _fs(path, 'string', content);
    // If the file already exist, append the given string
    else
      return _fs(path, 'string', str + (noNewLine ? '' : '\n') + content);
  };

  /**
    * Read a file
    * @param {string} path
    * @return {string|boolean}
    */
  this.readFile = function(path) {
    if(_agent && !agent('file/read', path))
      return false;

    return _fs(path, 'string');
  };

  /**
    * Remove a file
    * @param {string} path
    * @return {string|boolean}
    */
  this.removeFile = function(path) {
    if(_agent && !agent('file/remove', path))
      return false;

    // Fail if the file doesn't exist
    if(!this.fileExists(path = _normalize(path)))
      return false;

    // Fail if the file is undeletable or if the file is read-only and 'r' flag is set as undeletable
    if(_table[path] && (_table[path][2].indexOf('u') !== -1 || (_table[path][2].indexOf('r') !== -1 && _readOnlyIsUndeletable)))
      return false;

    delete _table[path];

    // Delete the file from its parent
    path = path.split('/');
    let last = path.pop();
    delete _fs(path.join('/'))[last];

    return true;
  };

  /**
    * Get a folder as a tree object
    * @param {string} path Path to the folder
    * @return {object|boolean}
    */
  this.getTree = function(path) {
    if(_agent && !agent('folder/tree', path))
      return false;

    let dir = _fs(path, 'object');

    // Fail if the specified folder doesn't exist
    if(!dir)
      return false;

    return _clone(dir);
  };

  /**
    * Get the FST entry of an item
    * @param {string} path
    * @return {array|boolean}
    */
  this.getTableEntry = function(path) {
    if(_agent && !agent('*/getTableEntry', path))
      return false;

    // Fail if the item doesn't exist or if there is no table entry for this item
    if(!_fs(path = _normalize(path)) || !_table.hasOwnProperty(path))
      return false;

    // [SECURITY] The table entry array is cloned to remove all reference between the returned array and the original array
    return [_table[path][0], _table[path][1], _table[path][2]];
  };

  /**
    * Add a flag to an item
    * @param {string} path
    * @param {string} flags One or more flag(s)
    * @return {boolean} Success
    */
  this.addFlag = function(path, flags) {
    if(_agent && !agent('flag/write', path, flags))
      return false;

    if(!_fs(path = _normalize(path)))
      return false;

    for(let i = 0; i < flags.length; i++)
      if(_table[path][2].indexOf(flags[i]) === -1)
        _table[path][2] += flags[i];

    return true;
  };

  /**
    * Remove a flag to an item
    * @param {string} path
    * @param {string} flags One or more flag(s)
    * @return {boolean} Success
    */
  this.removeFlag = function(path, flags) {
    if(_agent && !agent('flag/remove', path, flags))
      return false;

    if(!_fs(path = _normalize(path)))
      return false;

    for(let i = 0; i < flags.length; i++)
      if(_table[path][2].indexOf(flags[i]) !== -1)
        _table[path][2] = _table[path][2].replace(flags[i], '');

    return true;
  };

  /**
    * Check if an item has a flag
    * @param {string} path
    * @param {string} flag
    * @return {boolean} Success & has flag
    */
  this.hasFlag = function(path, flag) {
      if(_agent && !agent('flag/has', path))
      return false;

    return _fs(path = _normalize(path)) ? (_table.hasOwnProperty(path) && _table[path][2].indexOf(flag) !== -1) : false;
  };

  /**
    * Get all flags on an item
    * @param {string} path
    * @return {boolean} Success & has flag
    */
  this.getFlags = function(path) {
    if(_agent && !agent('flag/read', path))
      return false;

    return (_fs(path = _normalize(path)) && _table.hasOwnProperty(path) ? _table[path][2] : false);
  };

  /**
    * Get forbidden characters
    * @return {string}
    */
  this.getForbiddenChars = function() {
    return _forbiddenChars;
  };

  /**
    * Check if a character is forbidden
    * @param {string} char
    * @return {boolean} Found
    */
  this.isForbidden = function(char) {
    return (_forbiddenChars.indexOf(char) !== -1);
  };

  /**
    * Add one or more forbidden character(s)
    * @param {string} chars
    * @return {boolean} Success
    */
  this.forbid = function(chars) {
    // Fail if in locked mode
    if(_locked)
      return false;

    // Fail if the given characters is not a string
    // ..or if the string is empty
    if(typeof chars !== 'string' || !chars.length)
      return false;

    // The '/' symbol cannot be forbidden
    if(chars.indexOf('/') !== -1)
      return false;

    // Add one char by one char to see duplicates
    for(let i = 0; i < chars.length; i++)
      if(_forbiddenChars.indexOf(chars[i]) == -1)
        _forbiddenChars += chars[i];

    return true;
  };

  /**
    * Remove a forbidden character (will fail if the character is not forbidden)
    * @param {string} char
    * @return {boolean} Success
    */
  this.unforbid = function(char) {
    // Fail if in locked mode
    if(_locked)
      return false;

    // Fail if the character is not forbidden
    if(_forbiddenChars.indexOf(char) === -1)
      return false;

    _forbiddenChars = _forbiddenChars.replace(char, '');
    return true;
  };

  /**
    * Check if strict forbid mode is enabled
    * @return {boolean}
    */
  this.isStrictForbid = function() {
    return _strictCharsForbid;
  };

  /**
    * Enable the strict forbid mode
    * @return {boolean} Success
    */
  this.enableStrictForbid = function() {
    if(!_locked)
      _strictCharsForbid = true;

    return !_locked;
  };

  /**
    * Disable the strict forbid mode
    * @return {boolean} Success
    */
  this.disableStrictForbid = function() {
    if(!_locked)
      _strictCharsForbid = false;

    return !_locked;
  };

  /**
    * Lock settings (can't be canceled)
    */
  this.lock = function() {
    _locked = true;
  };

  /**
    * Check if settings are locked
    * @return {boolean}
    */
  this.isLocked = function() {
    return _locked;
  };

  /**
    * Check if there is an agent
    * @return {boolean}
    */
  this.isAgent = function() {
    return (_agent ? _agent('agent/exist') !== false : false);
  };

  /**
    * Normalize a path
    * @param {string} path
    * @param {boolean} returnArray Returns an array instead of a string
    * @return {string|array} Normalized path
    */
  this.normalize = function(path, returnArray) {
    return _normalize(path, returnArray);
  };

  Object.freeze(this);
};
