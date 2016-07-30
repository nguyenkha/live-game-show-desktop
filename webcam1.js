const fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var ffmpegCommand;
var outputStream = fs.createWriteStream('outputfile.mp4');;
//
// console.log(outputStream);

let videoSource = [];
let videoIndex = 0;
let videoSourceLength = 0;
webcamPrep();
// setInterval(function(){
//   console.log(outputStream);
// }, 1000);

outputStream.on('data', function(chunk) {
  console.log('ffmpeg just wrote ' + chunk.length + ' bytes');
});

function webcamPrep(){
    MediaStreamTrack.getSources(
        function(sourceInfos){
            var tempVideoIndex = 0;

            for (let i = 0; i != sourceInfos.length; ++i){
                //console.log(sourceInfos[i]);
                if (sourceInfos[i].kind === 'video') {
                    //console.log('video source found: ', sourceInfos);
                    videoSource[tempVideoIndex] = sourceInfos[i];
                    videoSourceLength++;
                    tempVideoIndex++;

                }
            }
            console.log(videoSource);
            playVideo();
        }
    );
}

navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia ||
                          navigator.webkitGetUserMedia);

function playVideo(){
  if (navigator.getUserMedia) {
    console.log('getUserMedia supported.');

    var constraints = {
      audio: true,
      video: {
          mandatory: {
              minWidth: 1280,
              minHeight: 720
              // sourceId:videoSource[videoIndex].id
          }
      }
    };
    var chunks = [];

    var onSuccess = function(stream) {
      console.log(stream);
      const video = document.querySelector('#liveVideo');
      video.src = window.URL.createObjectURL(stream);

      // var mediaRecorder = new MediaRecorder(stream);
      // console.log(mediaRecorder);
      //
      // mediaRecorder.start();

      ffmpegCommand = ffmpeg(stream, {f: 'webm', vcodec: 'VP8'})
        .videoCodec('libx264')
        .outputOptions(['-c:v libx264', '-preset fast', '-c:a libfdk_aac',
            '-ab 128k', '-ar 44100', '-f flv'])
        .pipe(fs.createWriteStream('out.mp4'));
        // .run();

      // ffmpegCommand.writeToStream(outputStream, { end: true });
      // setTimeout(function(){
      //   ffmpegCommand.writeToStream(outputStream, { end: true });
      // }, 20000);

      // mediaRecorder.onstop = function(e) {
      //   console.log("data available after MediaRecorder.stop() called.");
      //
      //   var clipName = prompt('Enter a name for your sound clip');
      //
      //   var clipContainer = document.createElement('article');
      //   var clipLabel = document.createElement('p');
      //   var audio = document.createElement('audio');
      //   var deleteButton = document.createElement('button');
      //
      //   clipContainer.classList.add('clip');
      //   audio.setAttribute('controls', '');
      //   deleteButton.innerHTML = "Delete";
      //   clipLabel.innerHTML = clipName;
      //
      //   clipContainer.appendChild(audio);
      //   clipContainer.appendChild(clipLabel);
      //   clipContainer.appendChild(deleteButton);
      //   soundClips.appendChild(clipContainer);
      //
      //   audio.controls = true;
      //   var blob = new Blob(chunks, { 'type' : 'video/webm' });
      //   chunks = [];
      //   var audioURL = window.URL.createObjectURL(blob);
      //   audio.src = audioURL;
      //   console.log("recorder stopped");
      //
      //   deleteButton.onclick = function(e) {
      //     evtTgt = e.target;
      //     evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      //   }
      // }

      // mediaRecorder.ondataavailable = function(e) {
      //   chunks.push(e.data);
      //   console.log(chunks.length);
      //   // debugger;
      //   // var blobURL = window.URL.createObjectURL(e);
      //   // document.write('<a href="' + blobURL + '">' + blobURL + '</a>');
      //   // console.log(e.data);
      // }
    }

    var onError = function(err) {
      console.log('The following error occured: ' + err);
    }

    navigator.getUserMedia(constraints, onSuccess, onError);
  } else {
     console.log('getUserMedia not supported on your browser!');
  }
}
