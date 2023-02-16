[![](https://img.shields.io/npm/v/@purewc/select-search/latest?style=flat-square)](http://npmjs.com/package/@purewc/select-search)

# `<select-search>`
An alternative select Web Component that implements search filtering.

[![](https://img.shields.io/github/issues-raw/mjbrisebois/purewc-select-search?style=flat-square)](https://github.com/mjbrisebois/purewc-select-search/issues)
[![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/purewc-select-search?style=flat-square)](https://github.com/mjbrisebois/purewc-select-search/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/purewc-select-search?style=flat-square)](https://github.com/mjbrisebois/purewc-select-search/pulls)


## Overview


## Usage

Install

```bash
npm i @purewc/select-search
```

Import and register as a custom element

```js
import { HTMLSelectSearchElement } from '@purewc/select-search';

customElements.define("select-search", HTMLSelectSearchElement );
```

HTML example

```html
<select-search value="angola">
    <option value="">Select a Country</option>
    <option value="afghanistan">Afghanistan</option>
    <option value="albania">Albania</option>
    ...
    <option value="zambia">Zambia</option>
    <option value="zimbabwe">Zimbabwe</option>
</select-search>
```


### Non-module Usage

Clone the project and run the webpack script.

```bash
npx webpack
```

Include the compiled output as a script.

```html
<script src="dist/purewc-select-search.auto.js"></script>
```

This will automatically register the element class as `select-search`.



## Demo

[https://mjbrisebois.github.io/purewc-select-search/docs/](https://mjbrisebois.github.io/purewc-select-search/docs/)


## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
