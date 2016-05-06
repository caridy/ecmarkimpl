## Ecmarkimpl CLI

The `ecmarkimpl` CLI is a tool to match functions implementing `<emu-alg>` steps with the corresponding ecmarkup spec text definitions.

This facilitate keeping implementation and spec text in sync by proving a mechanism to match functions with their `<emu-alg>`s.

### Features

This tool works by parsing any `javascript` file, looking for specific comments above function declarations or function expressions to infer the spec text and the `<emu-alg>` it corresponds to. For example, a JS file with the following content:

```javascript
...
// @spec[tc39/ecma402/master/spec/negotiation.html]
// @clause[sec-canonicalizelocalelist]
function CanonicalizeLocaleList() {}
...
```

In this case, `ecmarkimpl` will identify `@spec` and `@clause`, fetching the spec text in `ecmarkup` format from github.com, and transforming the function by adding the proper list of arguments and the proper body steps. As a result, it will transform the file into this:

```javascript
...
// @spec[tc39/ecma402/master/spec/negotiation.html]
// @clause[sec-canonicalizelocalelist]
function CanonicalizeLocaleList(locale) {
    // 1. If locales is undefined, then
    {
        // a. Return a new empty List.
        ;
    }
    // 2. Let seen be a new empty List.
    ;
    // 3. If Type(locales) is String, then
    {
        // a. Let O be CreateArrayFromList(« locales »).
        ;
    }
    // 4. Else,
    {
        // a. Let O be ? ToObject(locales).
        ;
    }
    // 5. Let len be ? ToLength(? Get(O, "length")).
    ;
    // 6. Let k be 0.
    ;
    // 7. Repeat, while k < len
    {
        // a. Let Pk be ToString(k).
        ;
        // a. Let kPresent be ? HasProperty(O, Pk).
        ;
        // a. If kPresent is true, then
        {
            // i. Let kValue be ? Get(O, Pk).
            ;
            // ii. If Type(kValue) is not String or Object, throw a TypeError exception.
            ;
            // iii. Let tag be ? ToString(kValue).
            ;
            // iv. If IsStructurallyValidLanguageTag(tag) is false, throw a RangeError exception.
            ;
            // v. Let canonicalizedTag be CanonicalizeLanguageTag(tag).
            ;
            // vi. If canonicalizedTag is not an element of seen, append canonicalizedTag as the last element of seen.
            ;
        }
        // a. Increase k by 1.
        ;
    }
    // 8. Return seen.
    ;
}
...
```

This process will facilitate the implementation of the spec text drastically, and the implementer will just need to fill the blanks for every step in the function body.

Additional, by running `ecmarkimpl` on the same file in the future, it will detect mismatches between the implementation and the spec text by comparing comments, and will suggest changes when possible to match the new spec text.

### Installation

Requires Node.js 4.0 or above.

```
npm install -g ecmarkimpl
```

### Usage

```
ecmarkimpl --help
ecmarkimpl ./path/to/folder/or/file.js
```

_Note:_ Use the `-d` or `--dry` option to run the tool in dry-run mode, which will not modify original files, and will only report the findings.

#### Other advanced options

Use a glob to search for specific files:

```
ecmarkimpl -g **/*Polyfill.js --dry
```

### License

This project is licensed under the [MIT License](LICENSE).
