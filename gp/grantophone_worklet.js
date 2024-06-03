class GrantophoneProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(message) {
    const data = message.data;


    switch (data.type) {
      case 'pointerdown':
        this.wasmExports.pointerdown(data.id, data.x, data.y);
        break;
      case 'pointermove':
        this.wasmExports.pointermove(data.id, data.x, data.y);
        break;
      case 'pointerup':
        this.wasmExports.pointerup(data.id);
        break;
      case 'wasm':
        // console.log(data);
        this.loadWasm(data.wasmArrayBuffer);
        break;
    }
  }

  loadWasm(data) {

    WebAssembly.instantiate(data).then(instance => {
      // console.log(instance);
      this.wasmExports = instance.instance.exports;

      this.wasmExports.init();

      // this.wasmExports.init();
    }).catch(error => {
      console.error(error);
    });
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const frequency = parameters.frequency;
    const numChannels = output.length;


    if (this.wasmExports) {
      this.wasmExports.generate_audio();

      const leftBufferPtr = this.wasmExports.get_left_buffer();
      const rightBufferPtr = this.wasmExports.get_right_buffer();


      const leftBuffer = new Float32Array(this.wasmExports.memory.buffer, leftBufferPtr, output[0].length);
      const rightBuffer = new Float32Array(this.wasmExports.memory.buffer, rightBufferPtr, output[0].length);


      output[0].set(leftBuffer);
      output[1].set(rightBuffer);
    }


    return true;
  }
}

registerProcessor('grantophone-processor', GrantophoneProcessor);
