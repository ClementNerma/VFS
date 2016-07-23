'use strict';

/**
  * Unit test library
  * @type {UnitTest}
  */
let UnitTest = (new (function() {
  let testOutput, noRuntimeError;

  /**
    * Load a unit test
    * @param {function} data
    * @eturn {void}
    */
  this.load = function(data) {
    let testI, _test = true, operations /* current 'it' block operations */, tops = 0 /* Total Operations */;

    // If no test unit was done before, we have to create an output for test results
    if(!testOutput) {
      testOutput = document.createElement('div');
      testOutput.setAttribute('id', 'tests-output');
      testOutput.style.border  = '1px solid gray';
      testOutput.style.padding = '5px';
      document.body.appendChild(testOutput);
    } else
      testOutput.innerHTML = '';

    /**
      * Describe a group of tests
      * @param {string} name
      * @param {function} callback
      * @return {void}
      */
    function describe(name, callback) {
      let dom;

      if(!_test)
        return ;

      if((dom = document.getElementsByClassName('describe')).length)
        dom[dom.length - 1].style.color = 'green';

      // DIsplay the describe's                                                                     
      testOutput.innerHTML += (tops ? '<br/><br/>' : '') + '<pre style="font-size:20px;margin:0;padding:0;" class="describe">' + name + '</pre><pre style="color:green;margin:0;padding-left:10px;;display:inline-block;" class="result success"></pre><pre style="color:green;margin:0;padding-left:10px;;display:inline-block;" class="result success"></pre><pre style="color:green;margin:0;padding-left:10px;display:inline-block;" class="result success"></pre>';
      testI = 0;
      let durey, started = Date.now();
      callback();
      durey = Date.now() - started;

      if(_test) {
        dom = document.getElementsByClassName('describe');
        dom[dom.length - 1].style.color = 'green';
        dom[dom.length - 1].innerHTML  += ' <small>' + durey + ' ms</small>';
      }
    }

    function it(name, callback) {
      if(!_test)
        return ;

        operations = 0;

      testI  += 1;
      let msg = '&nbsp;&nbsp;&nbsp;&nbsp;' + testI + ') ' + name, started = Date.now();
      noRuntimeError = false;

      try { callback(); }
      catch(e) {
        UnitTest.output(msg, Date.now() - started, operations, true);
        UnitTest.failed((noRuntimeError ? '' : '<span style="color:blue;">[Runtime Error]</span><br/>') + e.stack);
        _test = false;
        return ;
      }

      //UnitTest.output('<pre style="color:green;margin:0;padding:0;" class="log">' + msg + ' (' + (Date.now() - started) + ' ms) [' + operations + ' ops]</pre>');
      UnitTest.output(msg, Date.now() - started, operations);
    }

    /**
      * Count an assertion operation
      * @return {void}
      */
    function count_op() {
      operations += 1;
      tops       += 1;
    }

    /**
      * Cause an error when an assertion fails
      * @param {string} message Error message
      * @param {string} error Assertion error
      * @return {void}
      */
    function fail(message, error) {
      noRuntimeError = true;
      throw new Error('<em>' + (message || 'No description provided') + '</em>\n\nAssertion failed. ' + error);
    }

    function assert(val1, val2, message, nonStrict) {
      count_op();

      if(nonStrict ? val1 != val2 : val1 !== val2)
        fail(message, 'Expected "' + val2 + '", but "' + val1 + '" given');
    }

    let durey, started = Date.now();

    try { data.apply(window, [describe, it, assert]); }
    catch(e) { _test = false; this.failed('Test failed : Runtime error\n' + e.stack); }

    durey = Date.now() - started;

    if(_test)
      testOutput.innerHTML += '<br/><br/><pre style="color:green;margin:0;padding:0;" class="success">Test succeed in ' + durey + ' ms | ' + tops + ' operations</pre>'
  };

  this.output = function(msg, duration, operations, failed) {
    let div3 = testOutput.children[testOutput.children.length - 3],
        div2 = testOutput.children[testOutput.children.length - 2],
        div1 = testOutput.children[testOutput.children.length - 1],
        br   = (div3.innerHTML.length ? '<br/>' : ''),
        errorOpen = (failed ? '<span style="color:red;">' : ''),
        errorClose = (failed ? '</span>' : '');

    div3.innerHTML += br + errorOpen + msg + errorClose;
    div2.innerHTML += br + errorOpen + duration + ' ms' + errorClose;
    div1.innerHTML += br + errorOpen + operations + ' ops' + errorClose;
  };

  this.failed = function(stack) {
    let dom = document.getElementsByClassName('describe');

    if(dom.length)
      dom[dom.length - 1].style.color = 'red';

    testOutput.innerHTML += '<br/><br/><pre style="color:red;margin:0;padding:0;" class="failed">' + stack + '</pre>';
  };
})());
