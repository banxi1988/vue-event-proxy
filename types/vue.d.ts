import Vue from 'vue';

declare module "vue/types/vue" {
  interface Vue {
    /**
     *  Vue.$on 的全局事件版本
     */
    $gon(event: string | string[], fn: Function): Vue;
    /**
     *  Vue.$once 的全局事件版本
     */
    $gonce(event: string, fn: Function): Vue;
    /**
     *  Vue.$off 的全局事件版本
     */
    $goff(event: string, fn?: Function): Vue;
    /**
     *   清除所有的全局事件监听器
     */
    $goffAll(): Vue;
    /**
     *  Vue.$emit 的全局事件版本
     */
    $gemit(event: string, ...args: any[]): Vue;
  }
}
