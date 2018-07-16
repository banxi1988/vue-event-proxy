const Vue = require("vue");
const VueEventBus = require("../../dist/index").default;
const { assert } = require("chai");
Vue.use(VueEventBus);

describe("GlobalEventBus", () => {
  function makeTestObjects() {
    const vueA = new Vue();
    const vueB = new Vue();
    const spy = jasmine.createSpy("emitter");
    return { spy, vueA, vueB };
  }
  beforeEach(() => {});
  it("$gon", () => {
    const { vueA, vueB, spy } = makeTestObjects();
    const vueBId = vueB._uid;
    vueB.$gon("test", function() {
      expect(this._uid).toBe(vueBId, "vue call instance was not vueB");
      spy.apply(this, arguments);
    });
    vueA.$gemit("test", 1, 2, 3, 4);
    expect(spy.calls.count()).toBe(1);
    expect(spy).toHaveBeenCalledWith(1, 2, 3, 4);
  });
  it("$gon multi event", () => {
    const { vueA, vueB, spy } = makeTestObjects();
    const vueAId = vueA._uid;
    vueA.$gon(["test1", "test2"], function() {
      expect(this._uid).toBe(vueAId);
      spy.apply(this, arguments);
    });
    vueB.$gemit("test1", 1, 2, 3, 4);
    expect(spy.calls.count()).toBe(1);
    expect(spy).toHaveBeenCalledWith(1, 2, 3, 4);
    vueB.$gemit("test2", 5, 6, 7, 8);
    expect(spy.calls.count()).toBe(2);
    expect(spy).toHaveBeenCalledWith(5, 6, 7, 8);

    vueA.$destroy();
    vueB.$gemit("test1");
    vueB.$gemit("test2");
    expect(spy.calls.count()).toBe(2);
  });

  it("$goff multi event", () => {
    const { vueA, vueB, spy } = makeTestObjects();
    vueA.$gon(["test1", "test2", "test3"], spy);
    vueA.$goff(["test1", "test2"], spy);
    vueB.$gemit("test1");
    vueB.$gemit("test2");
    vueA.$gemit("test1");
    vueA.$gemit("test2");
    expect(spy).not.toHaveBeenCalled();
    vueB.$gemit("test3", 1, 2, 3, 4);
    expect(spy.calls.count()).toBe(1);
  });

  it("$gonce", () => {
    const { vueA, vueB, spy } = makeTestObjects();
    vueA.$gonce("test", spy);
    vueB.$gemit("test", 1, 2, 3);
    vueB.$gemit("test", 4, 5, 6);
    expect(spy).toHaveBeenCalledWith(1, 2, 3);
    expect(spy.calls.count()).toBe(1);
  });

  it("$goff", () => {
    const { vueA, vueB, spy } = makeTestObjects();
    vueA.$gon("test1", spy);
    vueA.$gon("test2", spy);
    vueA.$goff(); // like goffAll()
    vueB.$gemit("test1");
    vueB.$gemit("test2");
    expect(spy).not.toHaveBeenCalled();
  });

  it("$goff event", () => {
    const { vueA, vueB, spy } = makeTestObjects();
    vueA.$gon("test1", spy);
    vueA.$gon("test2", spy);
    vueA.$goff("test1");
    vueA.$goff("test1");

    vueB.$gemit("test1", 1);
    vueB.$gemit("test2", 2);

    expect(spy.calls.count()).toBe(1);
    expect(spy).toHaveBeenCalledWith(2);
  });

  it("$goff event + fn", () => {
    const { vueA, vueB, spy } = makeTestObjects();
    const spy2 = jasmine.createSpy("emitter");
    vueA.$gon("test", spy);
    vueA.$gon("test", spy2);
    vueA.$goff("test", spy);
    vueB.$gemit("test", 1, 2, 3);
    expect(spy).not.toHaveBeenCalled();
    expect(spy2.calls.count()).toBe(1);
    expect(spy2).toHaveBeenCalledWith(1, 2, 3);
  });

  it("removeListener logic", () => {
    const arr1 = [1, 4, 5];
    const arr2 = [1, 2, 3, 4, 5, 6];
    let i = arr2.length;
    while (i--) {
      const num = arr2[i];
      if (arr1.includes(num)) {
        arr2.splice(i, 1);
      }
    }
    expect(arr2).toEqual([2, 3, 6]);
  });
});
