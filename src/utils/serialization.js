class Cardano {
    _wasm;

    async load() {
      if (this._wasm) return;
  
      try {
        this._wasm = await import("@emurgo/cardano-serialization-lib-browser");
      } catch (error) {
        throw error;
      }
    }
  
    get instance() {
      return this._wasm;
    }
}
  
export default new Cardano();