var _streaming = {};
var _comments = {};
var _reactions = {};
var _lastestComment = undefined;
var _lastestCommentTime = 0;

var _comments = [
  {
    created_time: "2016-07-31T02:08:15+0000",
    message: 'A',
    from: {
      id: "1120182838021212",
      name: 'Hieu Pham'
    }
  },
  {
    created_time: "2016-07-31T02:08:27+0000",
    message: 'B',
    from: {
      id: "1370825412947621",
      name: 'Vo Hoai Len'
    }
  },
  {
    created_time: "2016-07-31T02:08:29+0000",
    message: 'C',
    from: {
      id: "1370825412947621",
      name: 'Vo Hoai Len'
    }
  }
];
var token = require('electron').remote.getGlobal('access_token');
var pageId = 'livegameshowapp';

$.ajax({
  url: 'https://graph.facebook.com/' + pageId + '',
  data: {
    access_token: token,
    fields: 'access_token'
  },
  success: function(result) {
    if (result.access_token) {
      token = result.access_token;
      console.log('Load page token', token, result);
    }
  }
});

var fetchCommentTimer = null;
var _questionStartTimes = ['Sun Jul 31 2016 09:07:57 GMT+0700 (ICT)]'];

var _optsToast = {
"closeButton": true,
"debug": false,
"positionClass": "toast-bottom-left",
"onclick": null,
"showDuration": "300",
"hideDuration": "1000",
"timeOut": "5000",
"extendedTimeOut": "1000",
"showEasing": "swing",
"hideEasing": "linear",
"showMethod": "fadeIn",
"hideMethod": "fadeOut"
};

function clearFetchCommentTimer() {
  if (fetchCommentTimer) { clearInterval(fetchCommentTimer); }
}

function fbProfileFrom(fbId) {
  return "http://graph.facebook.com/" + fbId + "/picture?type=square";
}

function renderLeaderboardRow(count, fbId, name, numCorrect, submittedAt) {
  return "<tr>" +
           "<td>" + count + "</td>" +
           "<td>" +
             "<img class='profile-view img-rounded' src='" + fbProfileFrom(fbId) + "'></img>" +
             "<span>" + name + "</span>" +
           "</td>" +
           "<td>" + numCorrect + "</td>" +
           "<td>" + moment(submittedAt).startOf('hour').fromNow() + "</td>" +
          "</tr>";
}

function showLeaderboard() {
  var numComments = _comments.length;
  $('.num-comments').text(numComments + ' comment(s) in total');
  var $body = $('.leaderboard-table tbody');
  var tr1 = renderLeaderboardRow(1, "1370825412947621", "Hieu", 1, new Date());
  var tr2 = renderLeaderboardRow(1, "1370825412947621", "Len", 2, new Date());
  $body.html(tr1 + tr2);
}

showLeaderboard();

function _requestComments() {
  if (window.fbStreamObj) {
    $.ajax({
      url: 'https://graph.facebook.com/' + window.fbStreamObj.id + '/comments',
      data: {
        access_token: token,
        limit: 2000
      },
      success: function(result) {
        _comments = result.data;
        console.log(_comments);
      }
    });

    $.ajax({
      url: 'https://graph.facebook.com/' + window.fbStreamObj.id + '/reactions',
      data: {
        access_token: token,
        limit: 2000
      },
      success: function(result) {
        _reactions = result.data;
        console.log(_reactions);
        if (_reactions && _reactions.length > 0) {
          if ($('#reactions-total').text() != _reactions.length) {
            $('#reactions').addClass('animated tada infinite');
            setTimeout(function() {
              $('#reactions').removeClass('animated tada infinite');
            }, 3000);
            $('#reactions-total').text(_reactions.length);
          }
        }
      }
    });
  }
}
function showLastComment(){
	if(_comments.length == 0)
		return;
	if(_lastestComment == undefined)
	{
		_lastestComment = _comments[0];
		// _lastestCommentTime =
	}
	toastr.warning(_comments[0].from.name + " just replied on your video stream with answer: " + _comments[0].message, null, _optsToast);
}

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

// Register sound
createjs.Sound.alternateExtensions = ["mp3"];
createjs.Sound.registerSound("./beep-07.mp3", "beep");
createjs.Sound.registerSound("./beep-09.mp3", "beep2");

var list_question = [];
var cur_question_idx = 0;

$('#startGameShowBtn').prop('disabled', true);

function addQuestionToList(data) {
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
                          'Answer: ' + data.answer +
                        '</div>'+
                      '</div>'+
                    '</div>');
};

$('#saveQuestionBtn').click(function() {
  var questionItem = {};
  questionItem.title = "Question " + (list_question.length + 1) + ": " +  $("#question-description").val();
  questionItem.answerA = "A: " + $("#answerA").val();
  questionItem.answerB = "B: " + $("#answerB").val();
  questionItem.answerC = "C: " + $("#answerC").val();
  questionItem.answerD = "D: " + $("#answerD").val();
  questionItem.answer  = $('#questionModal input:radio:checked').val();
  questionItem.id = list_question.length + 1;
  if(questionItem.answer == undefined)
  	return;
  addQuestionToList(questionItem);
  list_question.push(questionItem);
  $('#questionModal').modal('toggle');
  $('#startGameShowBtn').prop('disabled', false);
});

$('#startGameShowBtn').click(function() {
  $('#list-questions-screen').hide();
  $('#game-show-screen').show();
  _questionStartTimes = [];
  initGameShowScreen();
});

function initGameShowScreen() {
  $('#startQuestionBtn').prop('disabled', false);
  $('#nextQuestionBtn').prop('disabled', true);
  $('#stopGameShowBtn').prop('disabled', true);

  $('#video-overlay').show();
  $('#live-bagde').hide();
  $('#reactions').hide();
  $('#reactions-total').text('');

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

function loadQuestion(data) {
  _questionStartTimes.push(new Date());
  console.log(_questionStartTimes);

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
                          'Answer: ' + data.answer +
                        '</div>'+
                      '</div>'+
                    '</div>');
}

$('#startQuestionBtn').click(function() {
  cur_question_idx = 0;
  loadQuestion(list_question[cur_question_idx]);
  $('#startQuestionBtn').prop('disabled', true);
  if(list_question.length > 1)
    $('#nextQuestionBtn').prop('disabled', false);
  $('#stopGameShowBtn').prop('disabled', false);

  $('#countdown-to-live').text('3');
  createjs.Sound.play("beep");
  setTimeout(function() {
    $('#countdown-to-live').text('2');
    createjs.Sound.play("beep");
    setTimeout(function() {
      $('#countdown-to-live').text('1');
      createjs.Sound.play("beep");
      setTimeout(function() {
        $('#countdown-to-live').text('Go!');
        $('#reactions').show();
        $('#live-bagde').show();
        createjs.Sound.play("beep2");
        $('#video-overlay').fadeOut();
        setTimeout(function() {
          $('#countdown-to-live').text();
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);

  $.ajax({
    url: 'https://graph.facebook.com/me/live_videos',
    method: 'post',
    data: {
      access_token: token,
      published: true,
      privacy: { value: 'EVERYONE' }
    },
    success: function(result) {
      window.fbStreamObj = result;
      clearFetchCommentTimer();
      fetchCommentTimer = setInterval(_requestComments, 2000);

      // Run ffmpeg
      var ffmpegCli = spawn('ffmpeg', [
        '-re', '-i', "http://localhost:5123/",
        '-c:v', 'libx264', '-preset', 'fast',
        '-c:a', 'libfdk_aac', '-ab', '128k', '-ar', '44100',
        '-f', 'flv', result.stream_url ]);

      // ffmpegCli.stdout.on('data', (data) => {
      //   console.log(`ffmpeg stdout: ${data}`);
      // });

      // ffmpegCli.stderr.on('data', (data) => {
      //   console.log(`ffmpeg stderr: ${data}`);
      // });

      // ffmpegCli.on('close', (code) => {
      //   console.log(`ffmpeg process exited with code ${code}`);
      // });

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

$('#nextQuestionBtn').click(function() {
  if(list_question.length - 2 == cur_question_idx )
  {
    $('#startQuestionBtn').prop('disabled', true);
    $('#nextQuestionBtn').prop('disabled', true);
    $('#stopGameShowBtn').prop('disabled', false);
  }
  else
  {
    $('#startQuestionBtn').prop('disabled', true);
    $('#nextQuestionBtn').prop('disabled', false);
    $('#stopGameShowBtn').prop('disabled', false);
  }
  cur_question_idx++;
  loadQuestion(list_question[cur_question_idx]);
});

$('#stopGameShowBtn').click(function() {
  $('#game-show-screen').hide();
  $('#game-result-screen').show();

  if (mediaRecorder) {
    mediaRecorder.stop();
    clearFetchCommentTimer();
  }
});
