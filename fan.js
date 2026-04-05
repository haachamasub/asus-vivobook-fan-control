const {
  openAtkAcpi,
  forcePerformanceMode,
  closeAtkHandle,
} = require('./fan-core');

const PERFORMANCE_MODE = +process.argv[2];

const handle = openAtkAcpi();

if (!handle) {
  console.error('Please run as Administrator.');
  process.exit(1);
}

console.log('=== Asus Vivobook Performance Force ===');
console.log("Setting Mode to 'Performance' (High Fan Speed) every 10s...");

const forceMode = () => {
  const res = forcePerformanceMode(handle, PERFORMANCE_MODE);
  if (res !== 0) {
    console.log(`[${new Date().toLocaleTimeString()}] Performance Mode Forced.`);
  }
};

forceMode();
setInterval(forceMode, 10000);

process.on('SIGINT', () => {
  closeAtkHandle(handle);
  console.log('Released handle. BIOS will return to Auto soon.');
  process.exit();
});
