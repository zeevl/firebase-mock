# Tutorial: MockFirebase Basics

When writing unit tests with MockFirebase, you'll typically want to focus on covering one of two scenarios:

1. Your client receives data from Firebase by attaching a listener with `on`
2. Your client writes data to Firebase using a method like `set` or `push`

While your application almost certainly does both reading and writing to Firebase, each test should try to cover as small a unit of functionality as possible.

## Testing Reads

In this example, our source code will listen for new people on a reference we provide and call a function each time a new one is added. 

##### Source

```js
var people = {
  ref: function () {
    return new Firebase('htttps://example.firebaseio.com/people')
  },
  greet: function (person) {
    console.log('hi ' + person.first);
  }
};

people.ref().on('child_added', function (snapshot) {
  people.greet(snapshot.val());
});
```

In our tests, we'll override the `greet` method to verify that it's being called properly.

##### Test

```js
MockFirebase.override();
var ref = people.ref();
var greeted = [];
people.greet = function (person) {
  greeted.push(person);
};
ref.push({
  first: 'Michael'
});
ref.push({
  first: 'Ben'
});
ref.flush();
console.assert(greeted.length === 2, '2 people greeted');
console.assert(greeted[0].first === 'Michael', 'Michael greeted');
console.assert(greeted[1].first === 'Ben', 'Ben greeted');
```

Notice that we queued up multiple changes before actually calling `ref.flush`. MockFirebase stores these changes in the order they were created and then performs local updates accordingly. You'll only need to `flush` your changes when you need listeners, callbacks, and other asynchronous responses to be triggered.

## Testing Writes

Testing writes is especially easy with MockFirebase because it allows you to inspect the state of your data at any time. In this example, we'll add a new method to `people` that creates a new person with the given name:

##### Source

```js
people.create = function (first) {
  return people.ref().push({
    first: first
  });
};
```

##### Test

```js
var newPersonRef = person.create('James');
ref.flush();
var autoId = newPersonRef.key();
var data = ref.getData();
console.assert(data[autoId].first === 'James', 'James was created');
```