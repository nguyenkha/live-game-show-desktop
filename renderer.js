var _streaming = {};
var _comments = {};
var token = require('electron').remote.getGlobal('access_token')

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
