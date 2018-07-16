"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = __importDefault(require("vue"));
exports.eventBus = new vue_1.default();
var pluginName = "GlobalEventBus";
function makeEventKey(event) {
    return "global:" + event;
}
var fnIdSeq = 0;
function makeFnId(vid) {
    fnIdSeq++;
    return vid + "-" + fnIdSeq;
}
var fnIdkey = Symbol("fnId");
var VueEventBus = /** @class */ (function () {
    function VueEventBus() {
    }
    /**
     * 安装插件
     */
    VueEventBus.install = function (vueClass) {
        if (this.installed && this.vueClass === vueClass) {
            return;
        }
        console.info(pluginName, " installed");
        this.installed = true;
        this.vueClass = vueClass;
        this.applyMixin(vueClass);
        this.addGlobalEventApi(vueClass);
    };
    VueEventBus.addGlobalEventApi = function (vueClass) {
        var clazz = this;
        vueClass.prototype.$gon = function (event, fn) {
            var vue = this;
            var vid = vue._uid;
            if (vid === undefined) {
                console.error(pluginName, "no vid");
                return vue;
            }
            var events = event;
            if (!Array.isArray(event)) {
                events = [event];
            }
            var fnId = makeFnId(vid);
            fn[fnIdkey] = fnId;
            clazz.listenerVueMap.set(fnId, vue);
            for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
                var eventName = events_1[_i];
                var eventKey = makeEventKey(eventName);
                var listeners = clazz.keyEventListenersMap.get(eventKey) || [];
                listeners.push(fn);
                clazz.keyEventListenersMap.set(eventKey, listeners);
            }
            var vidFns = clazz.vidListenersMap.get(vid) || [];
            vidFns.push(fn);
            clazz.vidListenersMap.set(vid, vidFns);
            return vue;
        };
        vueClass.prototype.$gonce = function (event, fn) {
            var vue = this;
            function on() {
                vue.$goff(event, on);
                fn.apply(vue, arguments);
            }
            on.fn = fn;
            vue.$gon(event, on);
            return vue;
        };
        /**
         * clear all global event listener
         */
        vueClass.prototype.$goffAll = function () {
            clazz.removeListenersByVue(this);
            return this;
        };
        vueClass.prototype.$goff = function (event, fn) {
            var vue = this;
            if (!event) {
                vue.$goffAll();
                return vue;
            }
            if (Array.isArray(event)) {
                for (var _i = 0, event_1 = event; _i < event_1.length; _i++) {
                    var eventName = event_1[_i];
                    this.$goff(eventName, fn); // 递归
                }
                return vue;
            }
            var vid = vue._uid;
            if (vid === undefined) {
                console.error(pluginName, "no vid");
                return vue;
            }
            var eventKey = makeEventKey(event);
            var listeners = clazz.keyEventListenersMap.get(eventKey);
            if (!listeners || listeners.length < 1) {
                return vue;
            }
            if (!fn) {
                clazz.keyEventListenersMap.delete(eventKey);
                return vue;
            }
            else {
                var otherListeners = [];
                for (var _a = 0, listeners_1 = listeners; _a < listeners_1.length; _a++) {
                    var listener = listeners_1[_a];
                    var cb = listener;
                    // $goff 会把原始事件 Function 放在中间 Function 的 fn 属性中
                    if (cb !== fn && cb.fn !== fn) {
                        otherListeners.push(listener);
                    }
                }
                clazz.keyEventListenersMap.set(eventKey, otherListeners);
                return vue;
            }
        };
        vueClass.prototype.$gemit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var vue = this;
            var eventKey = makeEventKey(event);
            var listeners = clazz.keyEventListenersMap.get(eventKey);
            if (listeners && listeners.length > 0) {
                for (var _a = 0, listeners_2 = listeners; _a < listeners_2.length; _a++) {
                    var listener = listeners_2[_a];
                    var fnId = listener[fnIdkey];
                    if (!fnId) {
                        console.warn(pluginName, "not fnId in listener", listener);
                        continue;
                    }
                    var origVue = clazz.listenerVueMap.get(fnId);
                    if (origVue) {
                        listener.apply(origVue, args);
                    }
                    else {
                        console.warn(pluginName, "listener's original vue instance is gone:", listener);
                    }
                }
            }
            else {
                console.error(pluginName, "No global event listener for event:" + event);
            }
            return vue;
        };
    };
    /**
     * 移除 vue 实例设置的监听器
     * @param vue Vue 实例
     */
    VueEventBus.removeListenersByVue = function (vue) {
        var vid = vue._uid;
        var vueListeners = this.vidListenersMap.get(vid) || [];
        for (var _i = 0, vueListeners_1 = vueListeners; _i < vueListeners_1.length; _i++) {
            var listener = vueListeners_1[_i];
            var fnId = listener[fnIdkey];
            if (fnId) {
                this.listenerVueMap.delete(fnId);
            }
            else {
                console.warn("No fnI in listener ", listener, " for vue ", vid);
            }
        }
        this.keyEventListenersMap.forEach(function (listeners) {
            var i = listeners.length;
            while (i--) {
                var listener = listeners[i];
                if (vueListeners.includes(listener)) {
                    listeners.splice(i, 1);
                }
            }
        });
    };
    VueEventBus.applyMixin = function (vueClass) {
        var clazz = this;
        vueClass.mixin({
            beforeCreate: function () { },
            destroyed: function () {
                var vue = this;
                clazz.removeListenersByVue(vue);
            }
        });
    };
    VueEventBus.installed = false;
    VueEventBus.vueClass = null;
    /**
     * 全局事件名与监听函数的映射
     */
    VueEventBus.keyEventListenersMap = new Map();
    /**
     * 监听函数与注册时所在 Vue 实例的映射
     * （为了保证监听函数调用时其绑定的 this 是其 监听事件时所在的 Vue 实例）
     */
    VueEventBus.listenerVueMap = new Map();
    VueEventBus.vidListenersMap = new Map();
    return VueEventBus;
}());
exports.default = VueEventBus;
