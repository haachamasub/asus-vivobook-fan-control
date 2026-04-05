const koffi = require('koffi');

const lib = koffi.load('kernel32.dll');
const HANDLE = koffi.pointer('void');

const FILE_NAME = '\\\\.\\ATKACPI';
const CONTROL_CODE = 0x0022240c;
const DEVS = 0x53564544;
const INIT = 0x54494e49;
const VIVO_MODE = 0x00110019;

const CreateFileW = lib.func('__stdcall', 'CreateFileW', HANDLE, [
  'str16',
  'uint32',
  'uint32',
  'void *',
  'uint32',
  'uint32',
  HANDLE,
]);
const DeviceIoControl = lib.func('__stdcall', 'DeviceIoControl', 'int', [
  HANDLE,
  'uint32',
  'void *',
  'uint32',
  'void *',
  'uint32',
  'uint32 *',
  'void *',
]);
const CloseHandle = lib.func('__stdcall', 'CloseHandle', 'int', [HANDLE]);

function deviceSet(handle, deviceId, value) {
  const args = Buffer.alloc(8);
  args.writeUInt32LE(deviceId, 0);
  args.writeUInt32LE(value, 4);

  const acpiBuf = Buffer.alloc(16);
  acpiBuf.writeUInt32LE(DEVS, 0);
  acpiBuf.writeUInt32LE(8, 4);
  args.copy(acpiBuf, 8);

  const outBuffer = Buffer.alloc(16);
  let bytesReturned = 0;
  return DeviceIoControl(
    handle,
    CONTROL_CODE,
    acpiBuf,
    acpiBuf.length,
    outBuffer,
    outBuffer.length,
    bytesReturned,
    null
  );
}

function openAtkAcpi() {
  const handle = CreateFileW(FILE_NAME, 0xc0000000, 3, null, 3, 0x80, null);
  if (!handle || koffi.address(handle) === -1) {
    return null;
  }
  return handle;
}

function forcePerformanceMode(handle, performanceMode) {
  const initBuf = Buffer.alloc(12);
  initBuf.writeUInt32LE(INIT, 0);
  initBuf.writeUInt32LE(0, 4);
  DeviceIoControl(handle, CONTROL_CODE, initBuf, 12, Buffer.alloc(16), 16, 0, null);
  return deviceSet(handle, VIVO_MODE, performanceMode);
}

function closeAtkHandle(handle) {
  if (handle) CloseHandle(handle);
}

module.exports = {
  openAtkAcpi,
  forcePerformanceMode,
  closeAtkHandle,
};
