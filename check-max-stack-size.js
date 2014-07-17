function sum(n) {
  if (n < 1) return 0;
  return n + sum(n - 1);
}

var m = 1;

for (var i = 0; i < 10; ++i) {
  console.log(m, sum(m));
  m = m + "0";
}
