var video = document.getElementById('video');
var qualities = {}
var bigBuckBunny = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
var source2 = 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
var url = 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
var video4k = "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
var xvideo = 'https://cdn77-vid.xvideos-cdn.com/le1x8-oX1NrE_GI9MJNdHA==,1630954920/videos/hls/59/55/ea/5955ea1be6478fc778b6b0a9d14ff482/hls.m3u8'

// https://bitdash-a.akamaihd.net/content/MI201109210084_1/video/180_250000/hls/segment_0.ts
// https://bitdash-a.akamaihd.net/content/MI201109210084_1/video/1080_4800000/hls/segment_0.ts

const getQualities = (levels) => { 
  const levelsSorted = levels.sort((a,b)=> a.width-b.width)
  let qualitiesList = levelsSorted.map((item, index) => {
    const qualityName = getLevelName(item)
    return {
      index: index,
      name: qualityName,
      width: item.width
    }
  })
  // qualitiesList = qualitiesList.reverse();
  const qualityIndexes = qualitiesList.reduce((obj, item) => {
    obj[item.name] = item;
    return obj;
  }, {})

  reverseList = [...qualitiesList].reverse();
  return {
    list: qualitiesList,
    reverse:reverseList,
    indexes: qualityIndexes
  }
}

const getVideoQuality = (width) => {
  switch (true) {
    case (width > 960 && width <= 2560):
      return 'HD';
    case (width > 2560 && width <= 3840):
      return '4K';
    default:
      return false;
  }
}

const timeFormat = (number) => {
  var sec_num = Math.round(number)
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours <= 0) {
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return minutes + ':' + seconds;
  } else {
    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return hours + ':' + minutes + ':' + seconds;
  }
}

const getLevelName = (level) => {
  if (level.name) return level.name.match(/\d+p/) ? level.name : level.name + "p";
  else if (level.height) return level.height + "p";
  else if (level.width) return Math.round(level.width * 9 / 16) + "p";
  else if (level.bitrate) return (level.bitrate / 1000) + "kbps";
  else return 0;
}

var controlsWrapper = document.querySelector(".controls-wrapper")
var playerWrapper = document.querySelector("#player")
var progressElm = document.querySelector(".progress-bar")
var barElm = document.querySelector(".video-progress")
var knobElm = document.querySelector(".progress-bar-knob")
var preloadElm = document.querySelector(".preload-progress")
var playButtonElm = document.querySelector(".play-button")
var volumeBarElm = document.querySelector(".volume-wrapper")
var volumeContainer  = document.querySelector(".volume-container")
var playbackList = document.querySelector('.playback-list')
var qualityListElm = document.querySelector(".quality-list")
var fullscreenButton = document.querySelector(".fullscreen-button")
var timePopupElm = document.querySelector(".time-popup")
var timeElm = document.querySelector(".time")
var clickOverlay = document.querySelector(".click-overlay")
var settingsButton = document.querySelector(".settings-button")
var panel = document.querySelector(".panel")
var panelItems = document.querySelectorAll(".panel-item")
var bottomControls = document.querySelector(".bottom-controls")
var playerLoader = document.querySelector(".player-loader")
var playerNotifier = document.querySelector(".player-notifier")
var bottomTime = document.querySelector(".bottom-time")


var videoPosition = 0
var knobPressed = false;
var barActive = false;
var videoPlaying = false;
var videoLoading = true;
var updateProgressRequest = null;
var muted = null;
var preload = 0
var fullScreen = false
var showTooltip = false
var lastClick = 0
var timeout = null
var panelOpen = false
var currentLevel = null
var ended = false
var controlsTimeout = null

// svg icons
var playIcon = '<svg width="100%" height="100%" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="svg-icon " xmlns:xlink="http://www.w3.org/1999/xlink" style="fill: rgb(255, 255, 255); stroke: rgb(255, 255, 255);"><path d="M405.2,232.9L126.8,67.2c-3.4-2-6.9-3.2-10.9-3.2c-10.9,0-19.8,9-19.8,20H96v344h0.1c0,11,8.9,20,19.8,20  c4.1,0,7.5-1.4,11.2-3.4l278.1-165.5c6.6-5.5,10.8-13.8,10.8-23.1C416,246.7,411.8,238.5,405.2,232.9z"></path></svg>'
var pauseIcon = '<svg width="100%" height="100%" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="svg-icon " xmlns:xlink="http://www.w3.org/1999/xlink" style="fill: rgb(255, 255, 255); stroke: rgb(255, 255, 255);"><g><path d="M224,435.8V76.1c0-6.7-5.4-12.1-12.2-12.1h-71.6c-6.8,0-12.2,5.4-12.2,12.1v359.7c0,6.7,5.4,12.2,12.2,12.2h71.6   C218.6,448,224,442.6,224,435.8z"></path><path d="M371.8,64h-71.6c-6.7,0-12.2,5.4-12.2,12.1v359.7c0,6.7,5.4,12.2,12.2,12.2h71.6c6.7,0,12.2-5.4,12.2-12.2V76.1   C384,69.4,378.6,64,371.8,64z"></path></g></svg>'
var muteIcon = '<svg width="100%" height="100%" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" class="svg-icon " xmlns:xlink="http://www.w3.org/1999/xlink" style="fill: white;"><path d="M13.5,9 C13.5,7.2 12.5,5.7 11,5 L11,7.2 L13.5,9.7 L13.5,9 L13.5,9 Z M16,9 C16,9.9 15.8,10.8 15.5,11.6 L17,13.1 C17.7,11.9 18,10.4 18,8.9 C18,4.6 15,1 11,0.1 L11,2.2 C13.9,3.2 16,5.8 16,9 L16,9 Z M1.3,0 L0,1.3 L4.7,6 L0,6 L0,12 L4,12 L9,17 L9,10.3 L13.3,14.6 C12.6,15.1 11.9,15.5 11,15.8 L11,17.9 C12.4,17.6 13.6,17 14.7,16.1 L16.7,18.1 L18,16.8 L9,7.8 L1.3,0 L1.3,0 Z M9,1 L6.9,3.1 L9,5.2 L9,1 L9,1 Z"></path></svg>'
var volumeIcon = '<svg width="100%" height="100%" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" class="svg-icon " xmlns:xlink="http://www.w3.org/1999/xlink" style="fill: white;"><path d="M0,6 L0,12 L4,12 L9,17 L9,1 L4,6 L0,6 L0,6 Z M13.5,9 C13.5,7.2 12.5,5.7 11,5 L11,13 C12.5,12.3 13.5,10.8 13.5,9 L13.5,9 Z M11,0.2 L11,2.3 C13.9,3.2 16,5.8 16,9 C16,12.2 13.9,14.8 11,15.7 L11,17.8 C15,16.9 18,13.3 18,9 C18,4.7 15,1.1 11,0.2 L11,0.2 Z"></path></svg>'
var lowVolumeIcon = '<svg width="100%" height="100%" viewBox="0 0 17 17" xmlns="http://www.w3.org/2000/svg" class="svg-icon " xmlns:xlink="http://www.w3.org/1999/xlink" style="fill: white;"><path d="M13.5,8 C13.5,6.2 12.5,4.7 11,4 L11,12 C12.5,11.3 13.5,9.8 13.5,8 L13.5,8 Z M0,5 L0,11 L4,11 L9,16 L9,0 L4,5 L0,5 L0,5 Z"></path></svg>'
var fullscreenIcon = '<svg width="100%" height="100%" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" class="svg-icon " xmlns:xlink="http://www.w3.org/1999/xlink" style="fill: rgb(255, 255, 255); stroke: rgb(255, 255, 255);"><g><path d="M27,3H19.88V5H27V12h2V5A2,2,0,0,0,27,3Z"></path><path d="M5,5h7.06V3H5A2,2,0,0,0,3,5v7.12H5Z"></path><path d="M5,19.94H3V27a2,2,0,0,0,2,2h7.12V27H5Z"></path><path d="M27,27H19.94v2H27a2,2,0,0,0,2-2V19.86H27Z"></path></g></svg>'
var exitFullscreenIcon = '<svg width="100%" height="100%" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" class="svg-icon " xmlns:xlink="http://www.w3.org/1999/xlink" style="fill: rgb(255, 255, 255); stroke: rgb(255, 255, 255);"><g><path d="M10,10H3v2h7a2,2,0,0,0,2-2V3H10Z"></path><path d="M22,10V3H20v7a2,2,0,0,0,2,2h7V10Z"></path><path d="M20,22v7h2V22h7V20H22A2,2,0,0,0,20,22Z"></path><path d="M10,20H3v2h7v7h2V22A2,2,0,0,0,10,20Z"></path></g></svg>'
var replayIcon = '<svg height="100%" version="1.1" viewBox="8 7 22 22" width="100%" style="fill: rgb(255, 255, 255); stroke: rgb(255, 255, 255);"><path class="ytp-svg-fill" d="M 18,11 V 7 l -5,5 5,5 v -4 c 3.3,0 6,2.7 6,6 0,3.3 -2.7,6 -6,6 -3.3,0 -6,-2.7 -6,-6 h -2 c 0,4.4 3.6,8 8,8 4.4,0 8,-3.6 8,-8 0,-4.4 -3.6,-8 -8,-8 z" id="ytp-id-121"></path></svg>'

window.addEventListener('DOMContentLoaded', (event) => {
  setUserVolume()
});

// genetrate m3u8 playlist
function createPlaylist(listItems, baseUrl, qNum, videoId) {
  sortedList = [...listItems].sort(function(a,b) {
    return b - a
  })
  const targetDuration = Math.ceil(sortedList[0])
  let mediaPlaylist = "#EXTM3U \n#EXT-X-VERSION:3 \n#EXT-X-TARGETDURATION:"+targetDuration+"\n#EXT-X-ALLOW-CACHE:YES\n#EXT-X-MEDIA-SEQUENCE:0 \n"
  hashId = makeid(50)
  for (let i=0; i<listItems.length; i++) {
      mediaPlaylist += "#EXTINF:"+ listItems[i] +",\n"
      mediaPlaylist += baseUrl+"/video/"+hashId+"/"+qNum+"/"+videoId+"/"+i+"/"+"media-"+ i +"\n"
  }
  mediaPlaylist += "#EXT-X-ENDLIST"
  const palylistBlob = new Blob([mediaPlaylist], {
      type: 'application/x-mpegurl'
  });
  const playlistUrl = URL.createObjectURL(palylistBlob)
  return playlistUrl
}


function createMasterPlaylist(stream, baseUrl, videoId) {
  let masterPlaylist = "#EXTM3U\n"
  for (i=0; i< stream.length; i++) {
      masterPlaylist += "#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH="+stream[i][0]+",RESOLUTION="+stream[i][1]+"\n"
      masterPlaylist += createPlaylist(stream[i][2], baseUrl, i, videoId)+"\n"
  }
  const masterPalylistBlob = new Blob([masterPlaylist], {
      type: 'application/x-mpegurl'
  });
  const masterPlaylistUrl = URL.createObjectURL(masterPalylistBlob)
  return masterPlaylistUrl
}

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}

// start hls.js
var streamInfo =  [[1501986, "852x480", [12.058444, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 6.840167]], [420159, "426x240", [12.058444, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 6.840167]], [858257, "640x360", [12.058444, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 6.840167]], [2652630, "1280x720", [12.058444, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 6.840167]], [165259, "256x144", [12.058444, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 12.012, 9.009, 9.009, 6.840167]]]
test_url = "https://vkvd223.mycdn.me/video.m3u8?srcIp=140.82.60.255&expires=1639273192249&srcAg=CHROME_MAC&fromCache=1&ms=185.226.52.202&mid=1745109002457&type=4&sig=hLI1DJnYS1U&ct=8&urls=45.136.21.153&clientType=13&cmd=videoPlayerCdn&id=785770679021"
if (Hls.isSupported()) {
  muted = video.muted;
  var hls = new Hls();
  var playlistUrl = createMasterPlaylist(streamInfo, "https://frequencies-trivia-measurements-barnes.trycloudflare.com", "HooooetxxuQzwkQxxne")
  hls.loadSource("https://bp-expiration-round-whale.trycloudflare.com/master/HQtwzQnewuxoxzoxnQM");
  hls.attachMedia(video);
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    qualities = getQualities(hls.levels);
    currentLevel = hls.currentLevel
    setUserQuality()
  })    
}

// all the event listeners
video.addEventListener('play', (evt) => {
  videoPlaying = true
  updateProgressBar()
  togglePlayBtn()
})

video.addEventListener('pause', (evt) => {
  cancelAnimationFrame(updateProgressRequest);
  videoPlaying = false
  togglePlayBtn()
})

hls.on(Hls.Events.ERROR, (evt, error) => {
  console.log(error.details)
  if (error.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
    videoLoading = true;
    playerLoader.style.visibility = 'visible';
  }

})

hls.on(Hls.Events.LEVEL_SWITCHING, (event, data) => {
  if (hls.autoLevelEnabled) {
    if (!checkOnBufferedArea(video.currentTime)) {
      videoLoading = true;
      playerLoader.style.visibility = 'visible';
      preloadElm.style.transform = 'scaleX(0)';
    } else {
      videoLoading = false;
      playerLoader.style.visibility = 'hidden';
    }
  } else {
    videoLoading = true;
    playerLoader.style.visibility = 'visible';
    preloadElm.style.transform = 'scaleX(0)';
  }
  showControls();
})

hls.on(Hls.Events.FRAG_LOAD_PROGRESS, (event, data) => {
  if (videoLoading && data.frag.type === 'main') {
    let total = data.stats.total ? data.stats.total : 0;
    let fragDownloadPercent = total === 0 ? 0 : Math.round((data.stats.loaded / total) * 100)
    if (fragDownloadPercent >= 100) {
      videoLoading = false;
      playerLoader.querySelector("svg > text").textContent = '0%'
      playerLoader.style.visibility = 'hidden';
    } else {
      playerLoader.style.visibility = 'visible';
      playerLoader.querySelector("svg > text").textContent = `${fragDownloadPercent}%`
    }
  }
})

video.addEventListener('progress', () => {
  if (hls.autoLevelEnabled) {
    updateCurrentQuality(hls.currentLevel)
  }
  for (var i = 0; i <= video.buffered.length - 1; i++) {
    const currentTime = Math.ceil(video.currentTime) + 1;
    const startTime = Math.ceil(video.buffered.start(i));
    const endTime = Math.ceil(video.buffered.end(i));
    if (currentTime >= startTime && currentTime <= endTime) {
      let loadProgress = (endTime / video.duration);
      loadProgress = loadProgress > 1 ? 1 : loadProgress;
      // preload = loadProgress
      preloadElm.style.transform = `scaleX(${loadProgress})`;
      return;
    }
  }
})


// video.addEventListener('volumechange', () => {
//   position = video.volume
//   volumeBarElm.querySelector(".volume-bar").style.transform = `scaleX(${position})`;
//   volumeBarElm.querySelector(".volume-knob").style.transform = `translateX(${(position * 100) - 100}%)`;
//   setVolume(video.volume)
// })

playButtonElm.addEventListener('click', () => {
  togglePlay()
})

progressElm.addEventListener('mousedown', onMouseDown);
progressElm.addEventListener('touchstart', onTouchStart);
progressElm.addEventListener('mouseenter', timePopup);
progressElm.addEventListener('mouseleave', () => {
  timePopupElm.style.visibility = 'hidden'
});



volumeBarElm.addEventListener("mouseenter", () => {
  volumeBarElm.querySelector(".volume-panel").style.width = "80px"
  volumeBarElm.querySelector(".volume-panel").style.visibility = "visible"
  volumeBarElm.querySelector(".volume-panel").style.transition = "width 200ms ease-out"
})

volumeBarElm.addEventListener("mouseleave", () => {
  volumeBarElm.querySelector(".volume-panel").style.removeProperty("width")
  volumeBarElm.querySelector(".volume-panel").style.removeProperty("visibility")
  volumeBarElm.querySelector(".volume-panel").style.removeProperty("transition")
})

volumeBarElm.querySelector(".volume-button").addEventListener('click', () => {
  toggleMute()
})

fullscreenButton.addEventListener('click', () => {
  toggleFullscreen()
})

bottomControls.addEventListener('click', () => {
  closePanel()
})

playerWrapper.addEventListener('mousemove', (evt) => {
  showControls()
})

playerWrapper.addEventListener('mouseleave', (evt) => {
  hideControls()
})


clickOverlay.addEventListener('mousedown', (evt) => {
  if (evt.button === 0) {
    let currentTime = new Date().getTime();
    let clickLength = currentTime - lastClick;

    clearTimeout(timeout);
    if (clickLength < 250 && clickLength > 0) {
      toggleFullscreen()
    } else {
      timeout = setTimeout(function () {
        if (panelOpen) {
          closePanel()
        } else {
          if (videoPlaying) {
            sendNotify(pauseIcon)
          } else {
            sendNotify(playIcon)
          }
          togglePlay();
        }
        clearTimeout(timeout);
      }, 250);
    }
    lastClick = currentTime
  }
})

settingsButton.addEventListener('click', (evt) => {
  evt.stopPropagation()
  togglePanel()
})

function closeAllLists() {
  for (i=0; i < panelItems.length; i++) {
    panelItems[i].querySelector('.list').style.height = 0;
  } 
}

function addPanelEvents() {
  for (i=0; i < panelItems.length; i++) {
    panelItems[i].addEventListener('click', (evt) => {
      evt.stopPropagation()
      closeAllLists()
      currentListItems = evt.currentTarget.querySelectorAll(".list > .panel-menu-item")
      listHeight = currentListItems.length > 0 ? 
        (currentListItems[0].offsetHeight) * currentListItems.length : 0 
      evt.currentTarget.querySelector(".list").style.height = listHeight+'px'
    })    
  }
}

const checkOnBufferedArea = (bufferTime) => {
  for (var i = 0; i <= video.buffered.length - 1; i++) {
    const currentTime = Math.ceil(bufferTime + 1);
    const startTime = Math.ceil(video.buffered.start(i));
    const endTime = Math.ceil(video.buffered.end(i) + 1);
    if (currentTime >= startTime && currentTime <= endTime) {
      return true;
    }
  }
}



function seekingEvent() {
  if (!knobPressed) {
    updateCurrentTime(video.currentTime)
    const position = video.currentTime / video.duration;
    videoPosition = position;
    barElm.style.transform = `scaleX(${position})`;
    knobElm.style.transform = `translateX(${(position * 100) - 100}%)`;
  }

  // if (videoEnd) {
  //   setVideoEnd(false)
  // }

  if (!checkOnBufferedArea(video.currentTime)) {
    if (!videoLoading) {
      console.log('he')
      videoLoading = true;
      playerLoader.style.visibility = 'visible';
      showControls();
    }
  } else {
    if (videoLoading && currentLevel === hls.currentLevel) {
      videoLoading = false;
      playerLoader.style.visibility = 'hidden';
      // hideControlsWithDelay();
    }
  }
}

function updateTotalTime() {
  bottomTime.querySelector(".duration-time").textContent = timeFormat(video.duration)
}

function updateCurrentTime(timeValue) {
  bottomTime.querySelector(".current-time").textContent = timeFormat(timeValue)
}

video.addEventListener('timeupdate', () => {
  if (!knobPressed) {
    updateCurrentTime()
  }
  seekingEvent()
})

video.addEventListener('seeking', () => {
  seekingEvent()
})

video.addEventListener('ended', () => {
  videoLoading = false;
  playerLoader.style.visibility = 'hidden';
  ended = true
  showControls();

  if (playButtonElm.querySelector(".play-btn > svg")) {
    playButtonElm.querySelector(".play-btn > svg").remove()
  }
  playButtonElm.querySelector(".replay-btn").innerHTML = replayIcon
})

video.addEventListener("loadeddata", () => {
  console.log("loadeddata")
})

video.addEventListener("loadedmetadata", () => {
  console.log("loadedmetadata")
  initinalVideoSetup()
  video.play()
})

video.addEventListener("canplay", () => {
  console.log("canplay")
})

document.addEventListener('fullscreenchange', (evt) => {
  const isFullScreen = !!(document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
  if (isFullScreen) {
    fullScreen = true
    document.querySelector(".fullscreen-icon").innerHTML = exitFullscreenIcon
  } else {
    fullScreen = false
    document.querySelector(".fullscreen-icon").innerHTML = fullscreenIcon
  }
});

playbackList.addEventListener('click', (evt) => {
  evt.stopPropagation();
  playrate = evt.target.getAttribute('data-playrate')

  var elems = document.querySelectorAll(".playback-list > .panel-menu-item");
  
  for (i = 0; i < elems.length; i++ ) {
    elems[i].classList.remove('active')
  }

  document.querySelector(".playback-speed").querySelector('.current-item').innerHTML = evt.target.textContent

  evt.target.classList.add('active')
  if (video.playbackRate != playrate) {
      video.playbackRate = playrate
  }
})

function initinalVideoSetup() {
  // set volume
  // set qulity
  // 
  createQualityList()
  addPanelEvents()
  updateTotalTime()
}

function setUserQuality() {
  var qualityName = localStorage.getItem("quality")
  if (!qualityName) {
    hls.currentLevel = -1
    return
  }
  userQuality = qualities.indexes[qualityName] ? qualities.indexes[qualityName].index : null;
  
  userQuality = userQuality == null ? qualities.list.map(item => {
    return parseInt(item.name) > parseInt(qualityName) ? item.index : null
    }).filter(item => item)[0] : userQuality

  hls.currentLevel = userQuality
  currentLevel = userQuality
  updateCurrentQuality(userQuality)
}

function setUserVolume() {
  var volumeValue = localStorage.getItem("volume")
  var muteValue = localStorage.getItem("muted")
  
  if (!volumeValue) {
    return
  }

  setVolume(volumeValue)

  position = volumeValue
  volumeBarElm.querySelector(".volume-bar").style.transform = `scaleX(${position})`;
  volumeBarElm.querySelector(".volume-knob").style.transform = `translateX(${(position * 100) - 100}%)`;

  if (muteValue == 'true') {
    setMute()
  }

}

function updateVideoTime(time) {
    video.currentTime = time;
  }

function showControls() {
  controlsWrapper.style.visibility = "visible"
  controlsWrapper.style.opacity = 1
  playerWrapper.style.cursor = ''
  hideControlsWithDelay()
}

function hideControls() {
  if (!video.paused && !panelOpen && !knobPressed && !videoLoading) {
    controlsWrapper.style.visibility = "hidden"
    controlsWrapper.style.opacity = 0
    playerWrapper.style.cursor = 'none'
  }
}

function hideControlsWithDelay() {
  clearTimeout(controlsTimeout)
  controlsTimeout = setTimeout(() => {
    hideControls()
  }, 2000);
}

function toggleControls() {
  if (controlsWrapper.style.visibility == 'visible'){
    hideControls()
  } else {
    showControls()
  }
  
}

function toggleKnob() {
  if (knobPressed) {
    knobElm.classList.remove("progress-bar-knob")
    knobElm.classList.add("progress-bar-knob-active")
  } else {
    knobElm.classList.add("progress-bar-knob")
    knobElm.classList.remove("progress-bar-knob-active")
  }
}

function togglePlayBtn() {
  if (playButtonElm.querySelector('.replay-btn > svg')) {
    playButtonElm.querySelector(".replay-btn > svg").remove()
  } 
  if (videoPlaying) {
    if (playButtonElm.querySelector(".play-btn > svg")) {
      playButtonElm.querySelector(".play-btn > svg").remove()
    }
    playButtonElm.querySelector(".pause-btn").innerHTML = pauseIcon
  } else {
    if (playButtonElm.querySelector(".pause-btn > svg")) {
      playButtonElm.querySelector(".pause-btn > svg").remove()
    }
    playButtonElm.querySelector(".play-btn").innerHTML = playIcon
  }
}

function togglePlay() {
  if (videoPlaying) {
    video.pause()
  } else {
    video.play()
  }
}

function setMute() {
  video.muted = true
  muted = true
  localStorage.setItem('muted', true)
  volumeBarElm.querySelector(".volume-icon > svg").remove()
  volumeBarElm.querySelector(".volume-icon").innerHTML = muteIcon

  volumeBarElm.querySelector(".volume-bar").style.transform = 'scaleX(0%)';
  volumeBarElm.querySelector(".volume-knob").style.transform = `translateX(-100%)`;
}

function setUnMute() {
  video.muted = false
  muted = false
  localStorage.setItem('muted', false)
  volumeBarElm.querySelector(".volume-icon > svg").remove()
  volumeBarElm.querySelector(".volume-icon").innerHTML = volumeIcon
  
  position = video.volume
  volumeBarElm.querySelector(".volume-bar").style.transform = `scaleX(${position})`;
  volumeBarElm.querySelector(".volume-knob").style.transform = `translateX(${(position * 100) - 100}%)`;
}

function toggleMute() {
  if (video.muted) {
    setUnMute()
  } else {
    setMute()
  }
}

function toggleFullscreen() {
  const isFullScreen = !!(document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
  if (isFullScreen) {
    // fullScreen = false
    // document.querySelector(".fullscreen-icon").innerHTML = fullscreenIcon
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.webkitCancelFullScreen) document.webkitCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }
  else {
    // fullScreen = true
    // document.querySelector(".fullscreen-icon").innerHTML = exitFullscreenIcon
    if (playerWrapper.requestFullscreen) playerWrapper.requestFullscreen();
    else if (playerWrapper.mozRequestFullScreen) playerWrapper.mozRequestFullScreen();
    else if (playerWrapper.webkitRequestFullScreen) playerWrapper.webkitRequestFullScreen();
    else if (playerWrapper.msRequestFullscreen) playerWrapper.msRequestFullscreen();
  }
}

function closePanel() {
  closeAllLists()
  panelOpen = false
  panel.style.visibility = 'hidden'
  panel.style.opacity = 0
}

function openPanel() {
  panelOpen = true
  panel.style.visibility = 'visible'
  panel.style.opacity = 1
}


function togglePanel() {
  if (panel.style.visibility == 'visible') {
    closePanel()
  } else {
    openPanel()
  }
}

function onMouseDown(evt) {
    knobPressed = true
    toggleKnob()
    moveBarMoueHandler(evt)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp);
}

function onMouseUp(evt) {
    knobPressed = false
    toggleKnob()
    // props.setControlsActive(false)
    updateVideoTime(videoPosition * video.duration)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
}

function onMouseMove(evt) {
    moveBarMoueHandler(evt)
}

function moveBarMoueHandler(evt) {
    const windowOffsetLeft = progressElm.getBoundingClientRect().left;
    const elmOffsetLeft = progressElm.offsetLeft;
    const clientX = typeof evt.clientX !== 'undefined' ? evt.clientX : evt.touches[0].clientX;
    const clickPosition = clientX - windowOffsetLeft + elmOffsetLeft;
    const progressWidth = progressElm.offsetWidth;
    let position = clickPosition / progressWidth
    position = position < 0 ? 0 : position;
    position = position > 1 ? 1 : position;
    videoPosition = position; // set video position
    barElm.style.transform = `scaleX(${position})`;
    knobElm.style.transform = `translateX(${(position * 100) - 100}%)`;
    updateCurrentTime(position * video.duration)
    if (checkOnBufferedArea(position * video.duration)) {
      updateVideoTime(position * video.duration)
    }
}


function onTouchStart(evt) {
  knobPressed = true
  toggleKnob()
  moveBarMoueHandler(evt)
  window.addEventListener('touchmove', onTouchMove)
  window.addEventListener('touchend', onTouchEnd);
}

function onTouchEnd(evt) {
  knobPressed = false
  toggleKnob()
  updateVideoTime(videoPosition * video.duration)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd);
}

function onTouchMove(evt) {
  moveBarMoueHandler(evt)
}

function updateProgressBar() {
  if (!knobPressed){
    var position = video.currentTime / video.duration;
    videoPosition.current = position;
    barElm.style.transform = `scaleX(${position})`;
    knobElm.style.transform = `translateX(${(position * 100) - 100}%)`;
    updateProgressRequest = requestAnimationFrame(updateProgressBar);
  }
}

if (videoPlaying) {
  updateProgressRequest = requestAnimationFrame(updateProgressBar);
} else {
  cancelAnimationFrame(updateProgressRequest);
}


// volume silder

function moveVolumeBarHandler(evt) {
  const windowOffsetLeft = volumeContainer.getBoundingClientRect().left;
  const progressWidth = volumeContainer.offsetWidth;
  const offsetLeft = volumeContainer.offsetLeft;
  const clickPosition = evt.clientX - windowOffsetLeft;
  let position = clickPosition / progressWidth
  position = position < 0 ? 0 : position;
  position = position > 1 ? 1 : position;
  setVolume(position)
}

function setVolume(val) {
  volumeBarElm.querySelector(".volume-bar").style.transform = `scaleX(${val})`;
  volumeBarElm.querySelector(".volume-knob").style.transform = `translateX(${(val * 100) - 100}%)`;

  video.volume = val;
  changeVolumeIcon()
  localStorage.setItem("volume", val)
  if (video.muted) {
    toggleMute()
  }
}

function changeVolumeIcon() {
  if (video.volume < 0.5 && video.volume > 0){
    volumeBarElm.querySelector(".volume-icon > svg").remove()
    volumeBarElm.querySelector(".volume-icon").innerHTML = lowVolumeIcon
  } else if (video.volume == 0) {
    volumeBarElm.querySelector(".volume-icon > svg").remove()
    volumeBarElm.querySelector(".volume-icon").innerHTML = muteIcon
  } else {
    volumeBarElm.querySelector(".volume-icon > svg").remove()
    volumeBarElm.querySelector(".volume-icon").innerHTML = volumeIcon
  }
  
}

volumeContainer.addEventListener('mousedown', volumeOnMouseDown)
volumeContainer.addEventListener('wheel', wheelHandler)

function wheelHandler(evt) {
  evt.preventDefault();
  let volumeValue = evt.deltaY < 0 ? video.volume + 0.06 : video.volume - 0.06;
  volumeValue = volumeValue < 0 ? 0 : volumeValue;
  volumeValue = volumeValue > 1 ? 1 : volumeValue;
  setVolume(volumeValue)
}

function volumeOnMouseUp() {
  window.removeEventListener('mousemove', moveVolumeBarHandler)
}

function volumeOnMouseDown(evt) {
  moveVolumeBarHandler(evt)
  window.addEventListener('mousemove', moveVolumeBarHandler)
  window.addEventListener('mouseup', volumeOnMouseUp)
}

function createQualityList() {
  for (var i = 0; i < qualities.reverse.length; i++) {
    var qualityItem = document.createElement('div');
    qualityItem.classList.add("panel-menu-item");
    qualityItem.setAttribute("index", qualities.reverse[i].index);
    qualityItem.setAttribute("item", i);

    if (qualities.reverse[i].index == hls.currentLevel) {
      if (!hls.autoLevelEnabled){
        qualityItem.classList.add("active");
      }
    }

    if (getVideoQuality(qualities.reverse[i].width)) {
      qualityItem.innerHTML = qualities.reverse[i].name + "<div class='hd-mark'>"+getVideoQuality(qualities.reverse[i].width)+"</div>"
    } else {
      qualityItem.innerHTML = qualities.reverse[i].name
    }
    
    // var menuItem = document.createElement('div');
    // menuItem.classList.add("menu-item");
    // menuItem.appendChild(qualityItem)

    qualityListElm.appendChild(qualityItem)

    if (i+1 == qualities.reverse.length) {
      var qualityItem = document.createElement('div');
      qualityItem.classList.add("panel-menu-item");
      qualityItem.setAttribute("index", -1);
      qualityItem.setAttribute("item", -1);
      qualityItem.innerHTML = 'Auto'
      if (hls.autoLevelEnabled) {
        qualityItem.classList.add("active");
      }

      qualityListElm.appendChild(qualityItem)
    }
  }
}

function changeQuality(level) {
  hls.currentLevel = level
  currentLevel = level
}

function updateCurrentQuality(level) {
  if (level === -1) {
    return
  }
  const hdCheck = level >= 0 ? getVideoQuality(qualities.list[level].width) : false
  document.querySelector(".quality-selector").querySelector('.current-item').innerHTML = hls.autoLevelEnabled ? 
  'Auto ('+qualities.list[level].name+')' : qualities.list[level].name

  if (hdCheck) {
    settingsButton.querySelector(".mark-icon").innerHTML = '<div class="hd-icon">'+hdCheck+'</div>'
  } else {
    settingsButton.querySelector(".mark-icon").innerHTML = ''
  }
}

qualityListElm.addEventListener('click', (evt) => {
  evt.stopPropagation();
  var levelIndex = parseInt(evt.target.getAttribute('index'))

  if (levelIndex >= 0) {
    localStorage.setItem("quality", qualities.list[levelIndex].name)
    hls.autoLevelEnabled = false
  } else {
    localStorage.removeItem("quality")
  }
  
  const hdCheck = levelIndex >= 0 ? getVideoQuality(qualities.list[levelIndex].width) : false

  var elems = document.querySelectorAll(".quality-list > .panel-menu-item");
  
  for (i = 0; i < elems.length; i++ ) {
    elems[i].classList.remove('active')
  }

  if (hdCheck){
    document.querySelector(".quality-selector").querySelector('.current-item').innerHTML = qualities.list[levelIndex].name
  } else {
    document.querySelector(".quality-selector").querySelector('.current-item').innerHTML = evt.target.textContent
  }

  if (hdCheck) {
    settingsButton.querySelector(".mark-icon").innerHTML = '<div class="hd-icon">'+hdCheck+'</div>'
  } else {
    settingsButton.querySelector(".mark-icon").innerHTML = ''
  }
  
  evt.target.classList.add('active')
  
  // console.log('index level:'+levelIndex, 'hls current level:'+hls.currentLevel, 'currentLevel:'+currentLevel, hls.autoLevelEnabled)
  
  if (currentLevel != levelIndex || hls.autoLevelEnabled) {
      // console.log("level change")
      hls.currentLevel = levelIndex
      currentLevel = levelIndex
  }
})

progressElm.addEventListener('mousemove', tooltipMouseMove)
window.addEventListener('mouseup', tooltipMouseUp)

progressElm.addEventListener('touchmove', tooltipTouchMove)
window.addEventListener('touchend', tooltipTouchEnd)

function tooltipMouseMove(evt) {
  if (knobPressed) {
    window.addEventListener('mousemove', timePopup);
  } else {
    window.removeEventListener('mousemove', timePopup);
    timePopup(evt)
  }
}

function tooltipMouseUp() {
  timePopupElm.style.visibility = 'hidden'
  timePopupElm.style.left = '0px'
  window.removeEventListener('mousemove', timePopup);
}

function tooltipTouchMove(evt) {
  if (knobPressed) {
    window.addEventListener('touchmove', timePopup);
  } else {
    window.removeEventListener('touchmove', timePopup);
    timePopup(evt)
  }
}

function tooltipTouchEnd() {
  timePopupElm.style.visibility = 'hidden'
  timePopupElm.style.left = '0px'
  window.removeEventListener('touchmove', timePopup);
}


function timePopup(evt) {
  const progressWidth = progressElm.getBoundingClientRect().width;
  const windowsOffsetLeft = progressElm.getBoundingClientRect().left;
  const elmOffsetLeft = progressElm.offsetLeft;
  const clientX = typeof evt.clientX !== 'undefined' ? evt.clientX : evt.touches[0].clientX;
  const clickPosition = clientX - windowsOffsetLeft;

  // tooltipImageElm.current.style.width = props.imagePreview.imageSize ? `${props.imagePreview.imageSize.width}px` : `${timeElm.current.offsetWidth}px`;
  // tooltipImageElm.current.style.height = props.imagePreview.imageSize ? `${props.imagePreview.imageSize.height}px`: `0px`;

  const tooltipBoxWidth = parseInt(timePopupElm.getBoundingClientRect().width)
  
  let elmPos = clickPosition - (tooltipBoxWidth / 2) + elmOffsetLeft;
  elmPos = elmPos < elmOffsetLeft ? elmOffsetLeft : elmPos;
  elmPos = elmPos > progressWidth - (tooltipBoxWidth - elmOffsetLeft) ? progressWidth - (tooltipBoxWidth - elmOffsetLeft) : elmPos;
  
  timePopupElm.style.left = `${elmPos}px`;
  timePopupElm.style['background-color'] = 'black';
  let timePos = clickPosition / progressWidth;
  timePos = timePos < 0 ? 0 : timePos;
  timePos = timePos > 1 ? 1 : timePos;
  const time = Math.round(timePos * video.duration);
  timePopupElm.style.visibility = 'visible';
  timePopupElm.querySelector(".time").textContent = timeFormat(time);
  // const image = props.imagePreview.timeline ? props.imagePreview.timeline.filter(item => time > item.start && time <= item.end)[0] : null;

  
  // if (image) {
  //   tooltipImageElm.current.style.background = `url("${image.image}") -${image.right}px -${image.bottom}px`;
  // }
}

function updateVolumeNotify(volumeValue) {
  playerNotifier.querySelector(".volume-notify").innerHTML  = '<div class="volume-notifier">'+Math.round(volumeValue * 100)+'%</div>';  
}

function sendNotify(notifyIcon) {
  playerNotifier.querySelector(".notify-icon").innerHTML  = '<div class="notifier-warpper"><div class="notifier-icon">'+notifyIcon+'</div></div>';
}
var keysPressed = {};

document.addEventListener("keydown", globalHotkeysHandler);
playerWrapper.addEventListener("keydown", playerHotKeysHandler);
document.addEventListener('keyup', (evt) => {
  keysPressed = {};
});

function globalHotkeysHandler(evt) {
  keysPressed[evt.key] = true;
  var nodeName = evt.target.nodeName.toLowerCase()
  if (nodeName !== 'textarea' && nodeName !== 'input') {
    if (evt.key === 'f' || evt.keyCode === 70) {
      if (keysPressed['Control'] || keysPressed['Meta']) {
          return;
      }
      toggleFullscreen();
      showControls();
    } else if (evt.key === 'm' || evt.keyCode === 77) {
      toggleMute();
      if(video.muted) {
        sendNotify(muteIcon)
      }else {
        sendNotify(volumeIcon)
      }
      showControls();
    } else if (evt.key === 'j' || evt.keyCode === 74) {
      const time = video.currentTime - 10 <= 0 ? 0 : video.currentTime - 10;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === 'l' || evt.keyCode === 76) {
      const time = video.currentTime + 10 >= video.duration ? video.duration : video.currentTime + 10;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === 'ArrowLeft' || evt.keyCode === 37) {
      const time = video.currentTime - 5 <= 0 ? 0 : video.currentTime - 5;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === 'ArrowRight' || evt.keyCode === 39) {
      const time = video.currentTime + 5 >= video.duration ? video.duration : video.currentTime + 5;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === ' ' || evt.keyCode === 32) {
      evt.preventDefault()
      togglePlay();
      if (videoPlaying) {
        sendNotify(pauseIcon)
      } else {
        sendNotify(playIcon)
      }
      showControls();
    } else if (evt.key === 'k' || evt.keyCode === 75) {
      togglePlay();
      if (videoPlaying) {
        sendNotify(pauseIcon)
      } else {
        sendNotify(playIcon)
      }
      showControls();
    } else if (evt.key === 'play/pause' || evt.keyCode === 179) {
      togglePlay();
      showControls();
    } else if (evt.key === '0' || evt.keyCode === 48 || evt.keyCode === 96) {
      updateVideoTime(0);
      showControls();
    } else if (evt.key === '1' || evt.keyCode === 49 || evt.keyCode === 97) {
      const time = video.duration * 0.1;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === '2' || evt.keyCode === 50 || evt.keyCode === 98) {
      const time = video.duration * 0.2;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === '3' || evt.keyCode === 51 || evt.keyCode === 99) {
      const time = video.duration * 0.3;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === '4' || evt.keyCode === 52 || evt.keyCode === 100) {
      const time = video.duration * 0.4;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === '5' || evt.keyCode === 53 || evt.keyCode === 101) {
      const time = video.duration * 0.5;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === '6' || evt.keyCode === 54 || evt.keyCode === 102) {
      const time = video.duration * 0.6;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === '7' || evt.keyCode === 55 || evt.keyCode === 103) {
      const time = video.duration * 0.7;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === '8' || evt.keyCode === 56 || evt.keyCode === 104) {
      const time = video.duration * 0.8;
      updateVideoTime(time);
      showControls();
    } else if (evt.key === '9' || evt.keyCode === 57 || evt.keyCode === 105) {
      const time = video.duration * 0.9;
      updateVideoTime(time);
      showControls();
    }
    else if (evt.key === ',' || evt.keyCode === 188) {
      if (video.paused) {
        const time = video.currentTime - 0.04;
        updateVideoTime(time);
      }
    }
    else if (evt.key === '.' || evt.keyCode === 190) {
      if (video.paused) {
        const time = video.currentTime + 0.04;
        updateVideoTime(time);
      }
    }
     else {
      return;
    }
  }
}

function playerHotKeysHandler(evt) {
  
  // evt.stopPropagation()
  if (evt.key === 'ArrowUp' || evt.keyCode === 38) {
    evt.preventDefault()
    var volume = video.volume + 0.05 >= 1 ? 1 : video.volume + 0.05;
    setVolume(volume);
    sendNotify(volumeIcon)
    updateVolumeNotify(volume)
    // setVolumeNotification();
    showControls();
  } else if (evt.key === 'ArrowDown' || evt.keyCode === 40) {
    evt.preventDefault()
    if (video.volume == 0) {
      sendNotify(muteIcon)
    } else {
      sendNotify(lowVolumeIcon)
    }
    const volume = video.volume - 0.05 <= 0 ? 0 : video.volume - 0.05;
    updateVolumeNotify(volume)
    setVolume(volume);
    // setVolumeNotification();
    showControls();
  } else {
    return;
  }
}
