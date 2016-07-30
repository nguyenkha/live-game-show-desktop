// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
$('#sample-btn').click(function() {
  alert('test click');
});

// Import
var http = require('http');
var fs = require('fs');
var toBuffer = require('blob-to-buffer');
var spawn = require('child_process').spawn;

// Init
var gumVideo = document.getElementById('gum');

// Shim
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia ||
                          navigator.webkitGetUserMedia);

var httpRes;
var mediaRecorder;

// Start web server
var server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'video/webm');
  console.log('Hanging http result...');
  httpRes = res;
});

console.log('Fake http server listen on port 5123');
server.listen(5123);

var list_question = [];
var cur_question_idx = 0;
$('#game-show-screen').hide();
$('#game-result-screen').hide();
$('#startGameShowBtn').prop('disabled', true);
function addQuestionToList(data)
{
	$("#accordion-list-question").append('<div class="panel panel-default" id="accordion-item-' +data.id  + '">' + 
                      '<div class="panel-heading">' +
                        '<h4 class="panel-title">' +
                          '<a data-toggle="collapse" data-parent="#accordion" href="#collapse' + data.id + '">' + data.title + '</a>'+
                        '</h4>'+
                      '</div>'+
                      '<div id="collapse' + data.id + '" class="panel-collapse collapse in">'+
                        '<div class="panel-body">'+
                          '<ul data-role="listview">'+
                            '<li><a href="#"> ' + data.answerA + '</a></li>'+
                            '<li><a href="#"> ' + data.answerB + '</a></li>'+
                            '<li><a href="#"> ' + data.answerC + '</a></li>'+
                            '<li><a href="#"> ' + data.answerD + '</a></li>'+
                          '</ul>'+
                        '</div>'+
                      '</div>'+
                    '</div>');
};
$('#saveQuestionBtn').click(function()
{
	var questionItem = {};
	questionItem.title = "Question " + (list_question.length + 1) + ": " +  $("#question-description").val();
	questionItem.answerA = "A: " + $("#answerA").val();
	questionItem.answerB = "B: " + $("#answerB").val();
	questionItem.answerC = "C: " + $("#answerC").val();
	questionItem.answerD = "D: " + $("#answerD").val();
	questionItem.answer  = $('#questionModal input:radio:checked').val();
	questionItem.id = list_question.length + 1;
	addQuestionToList(questionItem);
	list_question.push(questionItem);
	$('#questionModal').modal('toggle');
	$('#startGameShowBtn').prop('disabled', false);
});

$('#startGameShowBtn').click(function()
{
	$('#list-questions-screen').hide();
	$('#game-show-screen').show();
	initGameShowScreen();
});

function initGameShowScreen()
{
	$('#startQuestionBtn').prop('disabled', false);
	$('#nextQuestionBtn').prop('disabled', true);
	$('#stopGameShowBtn').prop('disabled', true);

  // Start video
  navigator
    .getUserMedia({
      audio: true,
      video: true
    }, function(stream) {
      window.stream = stream;
      if (window.URL) {
        gumVideo.src = window.URL.createObjectURL(stream);
      } else {
        gumVideo.src = stream;
      }
    }, function(err) {
      console.log(err);
    });
};


function loadQuestion(data)
{
	$("#question-content").html('<div class="panel panel-default" id="answer-item-' +data.id  + '">' + 
                      '<div class="panel-heading">' +
                        '<h4 class="panel-title">' +
                          '<a href="#collapse' + data.id + '">' + data.title + '</a>'+
                        '</h4>'+
                      '</div>'+
                      '<div class="panel-collapse collapse in">'+
                        '<div class="panel-body">'+
                          '<ul data-role="listview">'+
                            '<li><a href="#"> ' + data.answerA + '</a></li>'+
                            '<li><a href="#"> ' + data.answerB + '</a></li>'+
                            '<li><a href="#"> ' + data.answerC + '</a></li>'+
                            '<li><a href="#"> ' + data.answerD + '</a></li>'+
                          '</ul>'+
                        '</div>'+
                      '</div>'+
                    '</div>');
}
$('#startQuestionBtn').click(function()
{
	cur_question_idx = 0;
	loadQuestion(list_question[cur_question_idx]);
	$('#startQuestionBtn').prop('disabled', true);
	if(list_question.length > 1)
		$('#nextQuestionBtn').prop('disabled', false);
	$('#stopGameShowBtn').prop('disabled', false);

  $.ajax({
    url: 'https://graph.facebook.com/me/live_videos',
    method: 'post',
    data: {
      access_token: token,
      published: true,
      privacy: { value: 'EVERYONE' }
    },
    success: function(result) {
      window.streamObj = result;

      console.log(result);

      // Run ffmpeg
      var ffmpegCli = spawn('ffmpeg', [ 
        '-re', '-i', "http://localhost:5123/", 
        '-c:v', 'libx264', '-preset', 'fast', 
        '-c:a', 'libfdk_aac', '-ab', '128k', '-ar', '44100', 
        '-f', 'flv', result.stream_url ]);

      ffmpegCli.stdout.on('data', (data) => {
        console.log(`ffmpeg stdout: ${data}`);
      });

      ffmpegCli.stderr.on('data', (data) => {
        console.log(`ffmpeg stderr: ${data}`);
      });

      ffmpegCli.on('close', (code) => {
        console.log(`ffmpeg process exited with code ${code}`);
      });

      // Start broadcast after 3s
      setTimeout(function() {
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

        mediaRecorder.onstop = function(e) {
          if (httpRes) {
            httpRes.end();
            httpRes = null;
          }
        };
        mediaRecorder.ondataavailable = function(e) {
          if (e.data && e.data.size > 0) {
            var buffer = toBuffer(e.data, function(err, buffer) {
              if (!err) {
                if (httpRes) {
                  httpRes.write(buffer);
                }
              }
            });
          }
        };
        mediaRecorder.start(10); // collect 10ms of data
        console.log('MediaRecorder started', mediaRecorder);
      }, 3000);
    }, error: function(err) {
      console.log('Cannot create live stream object')
    }
  });
});

$('#nextQuestionBtn').click(function()
{
	if(list_question.length - 2 == cur_question_idx )
	{
		$('#startQuestionBtn').prop('disabled', true);
		$('#nextQuestionBtn').prop('disabled', true);
		$('#stopGameShowBtn').prop('disabled', false);
	}
	else
	{
		cur_question_idx++;
		loadQuestion(list_question[cur_question_idx]);
		$('#startQuestionBtn').prop('disabled', true);
		$('#nextQuestionBtn').prop('disabled', false);
		$('#stopGameShowBtn').prop('disabled', false);
	}
});

$('#stopGameShowBtn').click(function()
{
	$('#game-show-screen').hide();
	$('#game-result-screen').show();

  if (mediaRecorder) {
    mediaRecorder.stop();
  }
});

var _streaming = {};
var _comments = {};
var token = require('electron').remote.getGlobal('access_token');

$('#create-live-stream').click(function() {
  $.ajax({
    url: 'https://graph.facebook.com/me/live_videos',
    method: 'post',
    data: {
      access_token: token,
      published: true,
      privacy: {value: 'EVERYONE'}
    },
    success: function(result) {
      console.log(result);
      _streaming = result;
    }
  });
});

$('#get-comments').click(function() {
  $.ajax({
    url: 'https://graph.facebook.com/' + _streaming.id + '/comments',
    data: {
      access_token: token,
      limit: 2000
    },
    success: function(result) {
      _comments = result;
    }
  });
});
