// @spec=whatwg/loader
// @aoid=Resolve
export function Resolve(loader, name, referrer) {
    // 1. Assert: loader must have all of the internal slots of a Loader Instance (3.5).
    assert('[[Registry]]' in loader, 'loader must have all of the internal slots of a Loader Instance (3.5).');
    // 2. Assert: Type(name) is String.
    assert(typeof name === 'string', 'Type(name) is String.');
    // 3. Assert: Type(referrer) is String.
    // TODO: diverging from the spec because referrer can undefined
    // assert(typeof referrer === 'string', 'Type(referrer) is String.');
    // 1. Let hook be GetMethod(loader, @@resolve).
    let hook = GetMethod(loader, Loader.resolve);
    // 2. Return the result of promise-calling hook(name, referrer).
    return promiseCall(hook, name, referrer);
}
