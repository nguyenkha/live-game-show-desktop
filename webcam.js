'use strict';

/* globals MediaRecorder */
const fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var toBuffer = require('blob-to-buffer');
var spawn = require('child_process').spawn;

// var rtmpUrl = 'rtmp://rtmp-api.facebook.com:80/rtmp/10153895175598865?ds=1&a=AaaMsEom6y00lqsf';

var httpResult;
var ffmpegCli;

var http = require('http');
var server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'video/webm');
  console.log('Hanging http result...');
  httpResult = res;
});

server.listen(5000);

var ffmpegCommand;
var outputStream = fs.createWriteStream('outputfile.mp4');

var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs;
var sourceBuffer;

var gumVideo = document.querySelector('video#gum');
var recordedVideo = document.querySelector('video#recorded');


var recordButton = document.querySelector('button#record');
var playButton = document.querySelector('button#play');
var downloadButton = document.querySelector('button#download');
recordButton.onclick = toggleRecording;
playButton.onclick = play;
downloadButton.onclick = download;

// window.isSecureContext could be used for Chrome
var isSecureOrigin = location.protocol === 'https:' ||
location.host === 'localhost';
// if (!isSecureOrigin) {
//   alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
//     '\n\nChanging protocol to HTTPS');
//   location.protocol = 'HTTPS';
// }

// Use old-style gUM to avoid requirement to enable the
// Enable experimental Web Platform features flag in Chrome 49

var constraints = {
  audio: true,
  video: true
};

function handleSuccess(stream) {
  console.log('getUserMedia() got stream: ', stream);
  window.stream = stream;
  if (window.URL) {
    gumVideo.src = window.URL.createObjectURL(stream);
  } else {
    gumVideo.src = stream;
  }
}

function handleError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

recordedVideo.addEventListener('error', function(ev) {
  console.error('MediaRecording.recordedMedia.error()');
  alert('Your browser can not play\n\n' + recordedVideo.src
    + '\n\n media clip. event: ' + JSON.stringify(ev));
}, true);

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    var buffer = toBuffer(event.data, function(err, buffer) {
      if (!err) {
        // console.log('Write buffer...');
        httpResult.write(buffer);
      }
    });
    // recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  setTimeout(function() {
    httpResult.end();
    console.log('Ending...')
  }, 5000);
  console.log('Recorder stopped: ', event);
}

function toggleRecording() {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
}

// The nested try blocks will be simplified when Chrome 47 moves to Stable
function startRecording() {
  // Run ffmpeg cli
  var ffmpegCli = spawn('ffmpeg', [ '-re', '-i', "http://localhost:5000/", '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'libfdk_aac', '-ab', '128k', '-ar', '44100', '-f', 'flv', document.getElementById('rtmpServerUrl').value ]);

  ffmpegCli.stdout.on('data', (data) => {
    console.log(`ffmpeg stdout: ${data}`);
  });

  ffmpegCli.stderr.on('data', (data) => {
    console.log(`ffmpeg stderr: ${data}`);
  });

  ffmpegCli.on('close', (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
  });

  setTimeout(function() {
    recordedBlobs = [];
    var options = {mimeType: 'video/webm;codecs=vp9'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(options.mimeType + ' is not Supported');
      options = {mimeType: 'video/webm;codecs=vp8'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: 'video/webm'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log(options.mimeType + ' is not Supported');
          options = {mimeType: ''};
        }
      }
    }
    try {
      mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
      console.error('Exception while creating MediaRecorder: ' + e);
      alert('Exception while creating MediaRecorder: '
        + e + '. mimeType: ' + options.mimeType);
      return;
    }
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    recordButton.textContent = 'Stop Recording';
    playButton.disabled = true;
    downloadButton.disabled = true;
    mediaRecorder.onstop = handleStop;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10); // collect 10ms of data
    console.log('MediaRecorder started', mediaRecorder);
  }, 3000);
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedBlobs);
  recordedVideo.controls = true;
}

function play() {
  // var superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  // var objectUrl = window.URL.createObjectURL(superBuffer);
  // console.log(objectUrl);
  // recordedVideo.src = objectUrl;
  ffmpegCommand = ffmpeg(sourceBuffer)
    .videoCodec('libx264')
    .outputOptions([
      '-c:v libx264',
      '-preset fast',
      '-c:a libfdk_aac',
      '-ab 128k',
      '-ar 44100',
      '-f flv'])
    .pipe(fs.createWriteStream('out.mp4'));
}

function download() {
  var blob = new Blob(recordedBlobs, {type: 'video/webm'});
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}
