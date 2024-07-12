const log = console.log;

const curry = f =>
  (a, ..._) => _.length ? f(a, ..._) : (..._) => f(a, ..._);

const isIterable = a => a && a[Symbol.iterator];

const go1 = (a, f) => a instanceof Promise ? a.then(f) : f(a);

const reduce = curry((f, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]();
    acc = iter.next().value;
  } else {
    iter = iter[Symbol.iterator]();
  }
  /**
   *    let cur;
   *   while (!(cur = iter.next()).done) {
   *     const a = cur.value;
   *         // 중간에 Promise를 한번 만나게 되면 그 이후의 모든 연산은 Promise로 처리하게 됨 => 연속적으로 비동기 발생
   *         // 개발자의 의도와 달라 질 수 있고, 중복되면 불필요한 로드로 인한 성능저하 유발 가능
   *         // 따라서 중간에 Promise를 만나도 이후에 Promise를 만나지 않는다면 다시 동기로 돌아와야 함
   *         acc = acc instanceof Promise ? acc.then(acc => f(acc, a)) : f(acc, a);
   *   }
   *   return acc;
   * */

  // 첫번째 인자가 Promise여도 문제 없도록 go1 함수를 사용
  return go1(acc, function recur (acc) {
    let cur;
    while (!(cur = iter.next()).done) {
      const a = cur.value;
      acc = f(acc, a);
      // Promise를 만나면 acc.then(recur)로 다시 돌아가는데, then 이후이기 때문에 Promise에서 다시 동기로 돌아온 상태가 된다
      // 따라서 이번에는 바로 return acc 이 됨(동기)
      if (acc instanceof Promise) return acc.then(recur);
    }
    return acc;
  });
});

const go = (...args) => reduce((a, f) => f(a), args);

const pipe = (f, ...fs) => (...as) => go(f(...as), ...fs);

const take = curry((l, iter) => {
  let res = [];
  iter = iter[Symbol.iterator]();
  let cur;
  while (!(cur = iter.next()).done) {
    const a = cur.value;
    res.push(a);
    if (res.length == l) return res;
  }
  return res;
});

const takeAll = take(Infinity);

const L = {};

L.range = function* (l) {
  let i = -1;
  while (++i < l) yield i;
};

L.map = curry(function* (f, iter) {
  for (const a of iter) {
    yield f(a);
  }
});

L.filter = curry(function* (f, iter) {
  for (const a of iter) {
    if (f(a)) yield a;
  }
});

L.entries = function* (obj) {
  for (const k in obj) yield [k, obj[k]];
};

L.flatten = function* (iter) {
  for (const a of iter) {
    if (isIterable(a)) yield* a;
    else yield a;
  }
};

L.deepFlat = function* f(iter) {
  for (const a of iter) {
    if (isIterable(a)) yield* f(a);
    else yield a;
  }
};

L.flatMap = curry(pipe(L.map, L.flatten));

const map = curry(pipe(L.map, takeAll));

const filter = curry(pipe(L.filter, takeAll));

const find = curry((f, iter) => go(
  iter,
  L.filter(f),
  take(1),
  ([a]) => a));

const flatten = pipe(L.flatten, takeAll);

const flatMap = curry(pipe(L.map, flatten));

var add = (a, b) => a + b;

const range = l => {
  let i = -1;
  let res = [];
  while (++i < l) {
    res.push(i);
  }
  return res;
};
