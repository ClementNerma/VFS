
/**
  * Benchmark a function, 100 000 tests
  * @param {string} function name
  * @param {number} pr benchmark precision, 1000 recommanded
  * @param {*} [a]
  * @param {*} [b]
  * @return {number} Speed, in microseconds
  */
function benchmark(name, pr, a, b) {
  var i, started, goal = pr * 1000;
  started = Date.now();

  for(i = 0; i < goal; i++) {
      s.exists(a, b);
  }

  return (Date.now() - started) / pr;
}

/**
  * Display a benchmark result
  * @param {string} name function name
  * @param {number} time duration of the benchmark, in microseconds
  */
function displayBenchmark(name, time) {
  output.innerHTML += '<tr><td>' + name + '</td><td>' + time + ' µs</td></tr>';
}

/** @type {Element} */
let output = document.getElementById('benchmark-output');

/** @type {VFS} */
let s = new VFS();

/** @type {Array} */
let tests = Object.keys(s);

for(let i = 0; i < tests.length; i++)
  displayBenchmark(tests[i], benchmark(tests[i], 200, 'a', 'a'));
