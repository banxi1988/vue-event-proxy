import Vue, { VueConstructor } from "vue";
declare var console: any;

export const eventBus = new Vue();
const pluginName = "GlobalEventBus";

function makeEventKey(event: string): string {
  return `global:${event}`;
}

let fnIdSeq = 0;
function makeFnId(vid: number) {
  fnIdSeq++;
  return vid + "-" + fnIdSeq;
}
const fnIdkey = Symbol("fnId");

type FnId = string;

export default class VueEventBus {
  static installed = false;
  static vueClass: VueConstructor | null = null;
  /**
   * 安装插件
   */
  static install(vueClass: VueConstructor) {
    if (this.installed && this.vueClass === vueClass) {
      return;
    }
    console.info(pluginName, " installed");
    this.installed = true;
    this.vueClass = vueClass;
    this.applyMixin(vueClass);
    this.addGlobalEventApi(vueClass);
  }

  /**
   * 全局事件名与监听函数的映射
   */
  private static keyEventListenersMap = new Map<string, Function[]>();
  /**
   * 监听函数与注册时所在 Vue 实例的映射
   * （为了保证监听函数调用时其绑定的 this 是其 监听事件时所在的 Vue 实例）
   */
  private static listenerVueMap = new Map<FnId, Vue>();
  private static vidListenersMap = new Map<number, Function[]>();
  private static addGlobalEventApi(vueClass: VueConstructor) {
    const clazz = this;
    vueClass.prototype.$gon = function(event: string | string[], fn: Function) {
      const vue = this;
      const vid = vue._uid;
      if (vid === undefined) {
        console.error(pluginName, "no vid");
        return vue;
      }
      let events = event;
      if (!Array.isArray(event)) {
        events = [event];
      }

      const fnId = makeFnId(vid);
      (fn as any)[fnIdkey] = fnId;
      clazz.listenerVueMap.set(fnId, vue);
      for (const eventName of events) {
        const eventKey = makeEventKey(eventName);
        const listeners = clazz.keyEventListenersMap.get(eventKey) || [];
        listeners.push(fn);
        clazz.keyEventListenersMap.set(eventKey, listeners);
      }
      const vidFns = clazz.vidListenersMap.get(vid) || [];
      vidFns.push(fn);
      clazz.vidListenersMap.set(vid, vidFns);

      return vue;
    };

    vueClass.prototype.$gonce = function(event: string, fn: Function) {
      const vue = this;
      function on() {
        vue.$goff(event, on);
        fn.apply(vue, arguments);
      }
      (on as any).fn = fn;
      vue.$gon(event, on);
      return vue;
    };
    /**
     * clear all global event listener
     */
    vueClass.prototype.$goffAll = function() {
      clazz.removeListenersByVue(this);
      return this;
    };
    vueClass.prototype.$goff = function(
      event?: string | string[],
      fn?: Function
    ) {
      const vue = this;
      if (!event) {
        vue.$goffAll();
        return vue;
      }
      if (Array.isArray(event)) {
        for (const eventName of event) {
          this.$goff(eventName, fn); // 递归
        }
        return vue;
      }
      const vid = vue._uid;
      if (vid === undefined) {
        console.error(pluginName, "no vid");
        return vue;
      }
      const eventKey = makeEventKey(event);
      const listeners = clazz.keyEventListenersMap.get(eventKey);
      if (!listeners || listeners.length < 1) {
        return vue;
      }
      if (!fn) {
        clazz.keyEventListenersMap.delete(eventKey);
        return vue;
      } else {
        const otherListeners = [];
        for (const listener of listeners) {
          const cb = listener as any;
          // $goff 会把原始事件 Function 放在中间 Function 的 fn 属性中
          if (cb !== fn && cb.fn !== fn) {
            otherListeners.push(listener);
          }
        }
        clazz.keyEventListenersMap.set(eventKey, otherListeners);
        return vue;
      }
    };

    vueClass.prototype.$gemit = function(event: string, ...args: any[]) {
      const vue = this;
      const eventKey = makeEventKey(event);
      const listeners = clazz.keyEventListenersMap.get(eventKey);
      if (listeners && listeners.length > 0) {
        for (const listener of listeners) {
          const fnId = (listener as any)[fnIdkey];
          if (!fnId) {
            console.warn(pluginName, "not fnId in listener", listener);
            continue;
          }
          const origVue = clazz.listenerVueMap.get(fnId);
          if (origVue) {
            listener.apply(origVue, args);
          } else {
            console.warn(
              pluginName,
              "listener's original vue instance is gone:",
              listener
            );
          }
        }
      } else {
        console.error(
          pluginName,
          "No global event listener for event:" + event
        );
      }
      return vue;
    };
  }

  /**
   * 移除 vue 实例设置的监听器
   * @param vue Vue 实例
   */
  private static removeListenersByVue(vue: Vue) {
    const vid = (vue as any)._uid;
    let vueListeners = this.vidListenersMap.get(vid) || [];
    for (const listener of vueListeners) {
      const fnId = (listener as any)[fnIdkey];
      if (fnId) {
        this.listenerVueMap.delete(fnId);
      } else {
        console.warn("No fnI in listener ", listener, " for vue ", vid);
      }
    }
    this.keyEventListenersMap.forEach(listeners => {
      let i = listeners.length;
      while (i--) {
        const listener = listeners[i];
        if (vueListeners.includes(listener)) {
          listeners.splice(i, 1);
        }
      }
    });
  }

  private static applyMixin(vueClass: VueConstructor) {
    const clazz = this;
    vueClass.mixin({
      beforeCreate() {},
      destroyed() {
        const vue = this as any;
        clazz.removeListenersByVue(vue);
      }
    });
  }
}
