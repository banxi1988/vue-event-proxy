# Vue Global EventBus

## Introduction

Let Vue.js support global events

TypeScript support already (actually this plugin is written by TypeScript)

## install

```bash
$ npm i vue-geventbus -S
# or
$ yarn add vue-geventbus -S
```

## Usage

1.  Install this Vue plugin

```js
import VueEventBus from "vue-geventbus";
Vue.use(VueEventBus);
```

2.  use Global Event function
    just like `Vue.$on` ,`Vue.$emit`, but this plugin handle global event
    below is the table

| Vue Api | VueEventBus Api |
| ------- | --------------- |
| $on     | $gon            |
| $once   | $gonce          |
| $emit   | $gemit          |
| $off    | $goff           |

More see: [https://cn.vuejs.org/v2/api/#vm-on](https://cn.vuejs.org/v2/api/#vm-on)
