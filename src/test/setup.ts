if (typeof globalThis.CustomEvent === 'undefined') {
  class CustomEventPolyfill<T = unknown> extends Event {
    detail: T;

    constructor(type: string, params?: CustomEventInit<T>) {
      super(type, params);
      this.detail = params?.detail as T;
    }
  }

  globalThis.CustomEvent = CustomEventPolyfill as unknown as typeof CustomEvent;
}
