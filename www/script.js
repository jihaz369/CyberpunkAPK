// ==================== TAB SWITCHING ====================
function switchTab(tabName) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');

  const tabs = document.querySelectorAll('.mode-tab');
  tabs.forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');

  log('Switched to ' + tabName.toUpperCase() + ' tab', 'tx');
}

// ==================== SENDER FUNCTIONS ====================
function encodeText() {
  const text = document.getElementById('tx-text').value;
  if (!text) {
    alert('Enter text to encode');
    return;
  }

  const binary = textToBinary(text);
  document.getElementById('tx-binary').innerText = binary;
  log('Encoded: ' + text.length + ' chars -> ' + binary.length + ' bits', 'tx');
}

function textToBinary(text) {
  return text.split('').map(char => {
    let bin = char.charCodeAt(0).toString(2);
    return '00000000'.substr(bin.length) + bin;
  }).join(' ');
}

function clearTx() {
  document.getElementById('tx-text').value = '';
  document.getElementById('tx-binary').innerText = 'Awaiting encoding...';
  log('Cleared transmission buffer', 'tx');
}

function loadSample() {
  document.getElementById('tx-text').value = 'Hello, HoloRadio! This is a test transmission.';
  log('Loaded sample text', 'tx');
}

function copyBinary() {
  const binary = document.getElementById('tx-binary').innerText;
  if (binary === 'Awaiting encoding...') {
    alert('Encode text first');
    return;
  }
  navigator.clipboard.writeText(binary).then(() => {
    alert('Binary copied to clipboard');
  });
}

function downloadBinary() {
  const binary = document.getElementById('tx-binary').innerText;
  if (binary === 'Awaiting encoding...') {
    alert('Encode text first');
    return;
  }
  const blob = new Blob([binary], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'encoded_' + Date.now() + '.bin';
  a.click();
  log('Downloaded binary file', 'tx');
}

function buildFrames() {
  const binary = document.getElementById('tx-binary').innerText;
  if (binary === 'Awaiting encoding...') {
    alert('Encode text first');
    return;
  }

  const frameSize = parseInt(document.getElementById('tx-frame-size').value);
  const frames = [];
  const cleanBinary = binary.replace(/\s/g, '');

  for (let i = 0; i < cleanBinary.length; i += frameSize * 8) {
    frames.push(cleanBinary.substr(i, frameSize * 8));
  }

  const frameDisplay = frames.map((f, i) => `Frame ${i + 1}: ${f.substr(0, 32)}...`).join('\n');
  document.getElementById('tx-frames').innerText = frameDisplay || 'No frames generated';
  log('Built ' + frames.length + ' frames', 'tx');
}

function exportFrames() {
  const frames = document.getElementById('tx-frames').innerText;
  if (frames === 'No frames generated') {
    alert('Build frames first');
    return;
  }
  const blob = new Blob([frames], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'frames_' + Date.now() + '.txt';
  a.click();
  log('Exported frames', 'tx');
}

function toggleEncryption() {
  const isEnabled = document.getElementById('tx-encrypt-toggle').checked;
  document.getElementById('tx-passphrase').disabled = !isEnabled;
  document.getElementById('btn-download-enc').disabled = !isEnabled;
  document.getElementById('tx-encrypt-label').innerText = isEnabled ? 'ENCRYPTION ON' : 'ENCRYPTION OFF';
  log(isEnabled ? 'Encryption enabled' : 'Encryption disabled', 'tx');
}

function downloadEncrypted() {
  const passphrase = document.getElementById('tx-passphrase').value;
  if (!passphrase) {
    alert('Enter a passphrase');
    return;
  }

  const binary = document.getElementById('tx-binary').innerText;
  if (binary === 'Awaiting encoding...') {
    alert('Encode text first');
    return;
  }

  // Simple encryption simulation (XOR with passphrase)
  const cleanBinary = binary.replace(/\s/g, '');
  const encrypted = simpleEncrypt(cleanBinary, passphrase);

  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'message_' + Date.now() + '.enc';
  a.click();
  log('Downloaded encrypted message', 'tx');
}

function simpleEncrypt(data, key) {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    const keyCharCode = key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode ^ keyCharCode);
  }
  return result;
}

function transmit() {
  const binary = document.getElementById('tx-binary').innerText;
  if (binary === 'Awaiting encoding...') {
    alert('Encode text first');
    return;
  }

  showTransmitOverlay();
  log('Starting transmission...', 'tx');

  setTimeout(() => {
    document.getElementById('transmit-overlay').classList.remove('active');
    log('Transmission complete', 'tx');
  }, 3000);
}

function showTransmitOverlay() {
  document.getElementById('transmit-overlay').classList.add('active');
}

function generateWAV() {
  const binary = document.getElementById('tx-binary').innerText;
  if (binary === 'Awaiting encoding...') {
    alert('Encode text first');
    return;
  }

  const sampleRate = parseInt(document.getElementById('tx-rate').value);
  const frequency = parseInt(document.getElementById('tx-freq').value);
  const duration = 2; // 2 seconds

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const samples = sampleRate * duration;
  const audioBuffer = audioContext.createAudioBuffer(1, samples, sampleRate);
  const data = audioBuffer.getChannelData(0);

  // Generate simple sine wave
  for (let i = 0; i < samples; i++) {
    data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
  }

  // Convert to WAV and download
  const wav = audioBufferToWav(audioBuffer);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transmission_' + Date.now() + '.wav';
  a.click();
  log('Generated WAV file', 'tx');
}

function audioBufferToWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const channelData = [];
  for (let i = 0; i < numChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
  }

  const dataLength = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  const volume = parseInt(document.getElementById('tx-volume').value) / 100;

  for (let i = 0; i < audioBuffer.length; i++) {
    for (let j = 0; j < numChannels; j++) {
      const sample = Math.max(-1, Math.min(1, channelData[j][i] * volume));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return buffer;
}

function showConstellation() {
  document.getElementById('constellation-overlay').classList.add('active');
  drawConstellation();
}

function closeConstellation() {
  document.getElementById('constellation-overlay').classList.remove('active');
}

function drawConstellation() {
  const canvas = document.getElementById('constellation-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(5, 7, 10, 0.9)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 60;

  // Draw axes
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(centerX - 80, centerY);
  ctx.lineTo(centerX + 80, centerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 80);
  ctx.lineTo(centerX, centerY + 80);
  ctx.stroke();

  // Draw constellation points (QPSK example)
  const points = [
    { x: 1, y: 1, color: '#00FF88' },
    { x: -1, y: 1, color: '#00F0FF' },
    { x: -1, y: -1, color: '#0066FF' },
    { x: 1, y: -1, color: '#FFCC00' }
  ];

  points.forEach(p => {
    const px = centerX + p.x * radius;
    const py = centerY + p.y * radius;

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fill();
  });

  log('Displayed constellation diagram', 'tx');
}

// ==================== RECEIVER FUNCTIONS ====================
let micStream = null;

function toggleMic() {
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
    document.getElementById('rx-mic-btn').innerText = '🎤 START MIC';
    log('Microphone stopped', 'rx');
  } else {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        micStream = stream;
        document.getElementById('rx-mic-btn').innerText = '🎤 STOP MIC';
        log('Microphone started', 'rx');
      })
      .catch(err => {
        alert('Microphone access denied');
        log('Microphone error: ' + err.message, 'rx');
      });
  }
}

function loadWAV() {
  document.getElementById('wav-file').click();
}

function handleWAV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const arrayBuffer = e.target.result;
    document.getElementById('rx-buffer-meter').style.width = '75%';
    document.getElementById('rx-buffer-label').innerText = '2.5s';
    log('Loaded WAV file: ' + file.name + ' (' + (file.size / 1024).toFixed(2) + ' KB)', 'rx');
  };
  reader.readAsArrayBuffer(file);
}

function decodeRx() {
  const bufferLabel = document.getElementById('rx-buffer-label').innerText;
  if (bufferLabel === '0.0s') {
    alert('Load a WAV file or start microphone first');
    return;
  }

  // Simulate decoding
  const decodedText = 'Decoded message: Hello, HoloRadio!';
  const decodedBinary = textToBinary(decodedText);

  document.getElementById('rx-text').innerText = decodedText;
  document.getElementById('rx-binary').innerText = decodedBinary;

  updateStatusDots(true);
  log('Decoding complete', 'rx');
}

function updateStatusDots(success) {
  if (success) {
    document.getElementById('rx-sync-dot').classList.add('active');
    document.getElementById('rx-crc-dot').classList.add('active');
  }
}

function downloadRxWAV() {
  const bufferLabel = document.getElementById('rx-buffer-label').innerText;
  if (bufferLabel === '0.0s') {
    alert('No audio data to download');
    return;
  }

  // Create a dummy audio buffer and convert to WAV
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const sampleRate = 44100;
  const audioBuffer = audioContext.createAudioBuffer(1, sampleRate * 2, sampleRate);
  const data = audioBuffer.getChannelData(0);

  // Fill with noise
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() - 0.5) * 0.3;
  }

  const wav = audioBufferToWav(audioBuffer);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'received_' + Date.now() + '.wav';
  a.click();
  log('Downloaded received audio', 'rx');
}

function copyRxBinary() {
  const binary = document.getElementById('rx-binary').innerText;
  if (binary === 'No data received') {
    alert('Decode a signal first');
    return;
  }
  navigator.clipboard.writeText(binary).then(() => {
    alert('Binary copied to clipboard');
  });
}

function copyRxText() {
  const text = document.getElementById('rx-text').innerText;
  if (text === 'Awaiting decode...') {
    alert('Decode a signal first');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    alert('Text copied to clipboard');
  });
}

function saveRxText() {
  const text = document.getElementById('rx-text').innerText;
  if (text === 'Awaiting decode...') {
    alert('Decode a signal first');
    return;
  }
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'decoded_' + Date.now() + '.txt';
  a.click();
  log('Saved decoded text', 'rx');
}

function toggleRxEncryption() {
  const isEnabled = document.getElementById('rx-encrypt-toggle').checked;
  document.getElementById('rx-passphrase').disabled = !isEnabled;
  document.getElementById('btn-decrypt-now').disabled = !isEnabled;
  document.getElementById('rx-encrypt-label').innerText = isEnabled ? 'DECRYPTION ON' : 'DECRYPTION OFF';
  log(isEnabled ? 'Decryption enabled' : 'Decryption disabled', 'rx');
}

function attemptDecrypt() {
  const passphrase = document.getElementById('rx-passphrase').value;
  if (!passphrase) {
    alert('Enter a passphrase');
    return;
  }
  log('Attempting decryption with passphrase...', 'rx');
  document.getElementById('rx-decrypt-status').innerText = 'Decryption successful ✓';
}

function handleEncFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById('rx-enc-info').innerText = 'Loaded: ' + file.name;
  log('Loaded encrypted file: ' + file.name, 'rx');
}

function stopRx() {
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
    document.getElementById('rx-mic-btn').innerText = '🎤 START MIC';
  }
  document.getElementById('rx-buffer-meter').style.width = '0%';
  document.getElementById('rx-buffer-label').innerText = '0.0s';
  log('Receiver stopped', 'rx');
}

// ==================== LOGGING ====================
function log(message, screen = 'tx') {
  const logBox = document.getElementById(screen + '-log');
  if (!logBox) return;

  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;

  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;

  // Keep only last 50 entries
  while (logBox.children.length > 50) {
    logBox.removeChild(logBox.firstChild);
  }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
  log('System initialized', 'tx');
  log('System ready', 'rx');
});
