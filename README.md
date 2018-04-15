# Collaborative Text Editor Example

[Live Demo](http://justinweiss-editor.herokuapp.com)

This app brings together the different ideas from my talk, _Building a Collaborative Text Editor_, into a full example that you can read and modify.

## Setting up the app

First, make sure you're running Postgresql. Since the app uses ActionCable, and uses database constraints to ensure that two operations can't happen at once, sqlite3 doesn't handle the load very well.

Run `bin/setup` to install the dependencies, and `bin/rails server` to start the server. `rake test && yarn test` will run all of the tests.

## Navigating the code

**There's one big difference from what I described in the talk: Most of the interesting code in this repo is written in JavaScript, not Ruby.** It's unfortunate, but it's the web, so that's what we have to work with.

The frontend code lives in [app/javasript/src/collaborative_editor](https://github.com/justinweiss/collaborative-demo/tree/master/app/javascript/src/collaborative_editor). It communicates with a small Rails server through ActionCable. Clients use cables to send and receive operations and selections in real time with other clients.

The most complicated code is the editor itself: the [CollaborativeEditor](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborativeEditor.js) class. This class is responsible for rendering the textarea, taking input from a user, and turning that input into operations. **This is one of the least important parts in an example, because in your own app, you'd replace this with something that fits your own needs.** Either an off-the-shelf editing component, or something you've written yourself. This is also responsible for any UI flakiness you notice in the demo -- turns out writing an editor is full of edge cases! This is written in React, but I'm thinking about rewriting it in Stimulus as a learning experience.

The CollaborativeEditor generates operations and updated selections, and hands them off to a [CollaborativeDocument](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborativeDocument.js). **If you think of CollaborativeEditor as a View, CollaborativeDocument is the model.** It keeps track of the state of the document, can apply operations, keeps track of local and remote selections, and manages the undo / redo stack.

CollaborativeDocument is what I mean when I say "Document" in the talk.

CollaborativeDocument has a [CollaborationClient](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborationClient.js) which handles transformation and server communication. When a CollaborativeDocument wants to tell other people about its operations and selections, it hands them off to a CollaborationClient, [like this](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborativeDocument.js#L37).

The CollaborationClient talks through ActionCable channels to the server. It [queues operations to send to the server](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborationClient.js#L164), [sends operations](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborationClient.js#L127), and [receives and transforms operations](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborationClient.js#L76).

The actual transforming code is in [transform.js](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/transform.js).

The Ruby side [receives operations](https://github.com/justinweiss/collaborative-demo/blob/master/app/channels/operations_channel.rb), and broadcasts them to other clients.

One quirk of this implementation: **Instead of checking version numbers manually, like I described in the talk, I have a constraint in the database that ensures that each operation has a unique version number.** This prevents two operations with the same version (operations that happened simultaneously) from making their way to other clients. It's a little bit of a hack, but it's easy to be sure it's working.

If the validation fails, the client that sent the failing operation is notified, and knows it needs to do a transformation.

## Code from the talk

There are a few bits of code and algorithms I mentioned in the talk. Here are pointers to all of them: 

* [The "insert / insert" transform_component function](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/transform.js#L56)
* [The control algorithm](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/transform.js#L3) (dealing with multiple simultanous operations)
* [Cursor synchronization version handling](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/SelectionsChannel.js#L31)
* [Local Undo](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/UndoStack.js)
* [An operation fuzzer](https://github.com/justinweiss/collaborative-demo/blob/master/test/javascripts/collaborative_editor/fuzzer.test.js)
* [When you perform an operation...](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborativeDocument.js#L29)
* [When you receive an operation...](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborativeDocument.js#L71) (also [here](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborationClient.js#L76))
* [When you change your cursor selection...](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborativeDocument.js#L133)
* [When you receive a cursor...](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/SelectionsChannel.js#L31)

## Differences from the talk

There are a few differences from what I described in the talk. Well, aside from the complete change in language!

* When you perform an operation, it doesn't get sent to the server immediately. **The operation is put into a queue, and operations are pulled off the queue to send to the server.** This happens because the server can only handle one operation at a time, needs to transform operations that haven't been acknowledged, and can add the operation back onto the queue if it's not accepted. It also gives us the opportunity to:
* **Compose operations.** Composing takes several operations and turns them into a single operation that has the same effect. Since we can only send one operation to the server at a time, composing opeartions is a huge speed improvement. It also helps transformation performance, because of the nested loops in our control algorithm. Composing happens [in compose.js](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/compose.js).
* On operations, `type` is called `kind`, because the model was unhappy with a field named `type`.
* We [regularly ping other clients with our current selection](https://github.com/justinweiss/collaborative-demo/blob/master/app/javascript/src/collaborative_editor/CollaborationClient.js#L29), both so that they know when we're there, and so that they don't have to mess with selections on different document versions.
