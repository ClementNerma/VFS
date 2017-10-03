
# Virtual File System

*VFS* is a FileSystem in-RAM emulator. It emulates a hard drive in the RAM to permit files manipulation.

## 1. How to use

In your HTML page, load the library file :

```html
<script type="text/javascript" src="vfs.js"></script>
```

And let's play with it !

To create a new virtual storage instance :

```javascript
let storage = new VFS();
```

## 2. Basic usage

Here is a sample code :

```javascript
// We create a file
storage.writeFile('hello.txt', 'hi !'); // true
// ... and read it
storage.readFile('hello.txt'); // 'hi !'
// Next we make a folder
storage.makedir('documents'); // true
// We read the root
storage.readdir('/'); // ['hello.txt', 'documents']
// We put a file into the folder
storage.writeFile('documents/plan.txt', '1. Introduction\n...'); // true
// ... and read it (to be sure)
storage.readFile('documents/plan.txt'); // '1. Introduction\n...'
// Now we delete the first file
storage.removeFile('hello.txt'); // true
// And the entire folder !
storage.removedir('documents'); // false
// But it fails because the folder is not empty. So we force the removing...
storage.removedir('documents', true); // true
// Finally, there's nothing left...
storage.readdir('/'); // []
```

Simple, isn't it ?
You can also export the entire storage you've made :

```javascript
// Export the entire folder
storage.getTree();
// OR
storage.getTree('/');
// {
//   "hello.txt": "hi !",
//   "documents": {
//     "plan.txt": "1. Introduction\n..."
//   }
// }
//
```

Otherwise, you can export a single folder :

```javascript
storage.getTree('documents');
// {
//   "plan.txt": "1. Introduction\n..."
// }
```

## License

This project is under the [GNU GPL license](LICENSE.md) terms.
