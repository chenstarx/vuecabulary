// event.js
// being used to transfer data or event between different pages and components

const events = {}

// in order to function properly in Vue, 'this' is required in the tuple.
// eg. event.on('login', this, () => { console.log('login event') })

const event = {
  on (name, self, callback) {
    let tuple = [self, callback]
    let callbacks = events[name]
    if (Array.isArray(callbacks)) {
      callbacks.push(tuple)
    } else {
      events[name] = [tuple]
    }
  },
  remove (name, self) {
    let callbacks = events[name]
    if (Array.isArray(callbacks)) {
      events[name] = callbacks.filter((tuple) => {
        return tuple[0] !== self
      })
    }
  },
  emit (name, data) {
    let callbacks = events[name]
    if (Array.isArray(callbacks)) {
      callbacks.map((tuple) => {
        let self = tuple[0]
        let callback = tuple[1]
        callback.call(self, data)
      })
    }
  },
  has (name) {
    return !!events[name]
  },
  off (name) {
    events[name] = []
  }
}

export default event
