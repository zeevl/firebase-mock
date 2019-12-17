# Tutorial: Authentication

MockFirebase replaces most of Firebase's messaging method of the admin API with simple mocks. Messaging methods will always succeed unless an error is specifically specified using [`failNext`](../API.md#failnextmethod-err---undefined).

## Send message

In this example, we'll create send a new message using Firebase messaging.

##### Source

```js
var ref;
var messageService = {
  messaging: function () {
    if (!ref) ref = firebase.messaging();
    return ref;
  },
  send: function () {
    var message = {

    };
    messageService.ref().send();
  },
}
```

##### Test

```js
MockFirebase.override();
var result = messageService.send();
messageService.messaging().flush();
result.then(function (messageId) {
  console.log(messageId);
});
```

## Supported methods

- [send(message: Message, dryRun?: boolean): Promise<string>](https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send)
- [sendAll(messages: Array<Message>, dryRun?: boolean): Promise<BatchResponse>](https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send-all)
- [sendMulticast(message: MulticastMessage, dryRun?: boolean): Promise<BatchResponse>](https://firebase.google.com/docs/reference/admin/node/admin.messaging.Messaging.html#send-multicast)

## Set custom message response
In some cases it could be necessary to fake a custom send response (like a [BatchResponse](https://firebase.google.com/docs/reference/admin/node/admin.messaging.BatchResponse.html)). In this cases you can use `firebase.messaging().nextResult(methodName, result)` (similar to `firebase.messaging().failNext(methodName, err)`).

##### Source

```js
var ref;
var messageService = {
  messaging: function () {
    if (!ref) ref = firebase.messaging();
    return ref;
  },
  send: function () {
    var message = {

    };
    messageService.ref().send();
  },
}
```

##### Test

```js
MockFirebase.override();
var batchResponse = {
  failureCount: 1,
  response: [
    {
      error: {...},
      messageId: undefined,
      success: false
    },
    {
      error: undefined,
      messageId: '...',
      success: true
    }
  ],
  successCount: 1
}
messageService.messaging().nextResult('sendAll', batchResponse);
var result = messageService.sendAll();
messageService.messaging().flush();
result.then(function (res) {
  console.assert(res.failureCount === 1, '1 message failed');
  console.assert(res.successCount === 1, '1 message succeeded');
});
```

## Assert arguments
If you want to assert the arguments that were passed to any of the send-functions you can register a callback.

##### Source

```js
var ref;
var messageService = {
  messaging: function () {
    if (!ref) ref = firebase.messaging();
    return ref;
  },
  send: function () {
    var message = {
      data: {
        foo: 'bar'
      },
      ...
    };
    messageService.ref().send();
  },
}
```

##### Test

```js
MockFirebase.override();
messageService.ref().on('send', function(args) {
  console.assert(args.data.foo === 'bar', 'message is coorect');
});
messageService.send();
messageService.messaging().flush();
```