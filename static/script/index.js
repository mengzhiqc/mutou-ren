var img = {}, sound = {},
    imgsrc = [
        "hongxing",
        //"wood_1s_b",
        //"wood_1s_f",
        "wood_1b",
        //"wood_2s_b",
        //"wood_2s_f",
        "wood_2b",
        //"wood_3s_b",
        //"wood_3s_f",
        "wood_3b",
        "bose_s_0",
        "bose_s_1",
        "bose_s_2",
        "bose_b",
        "win_bg",
        "start_bg",
        "selec_bg",
        "selec_cover",
        "selec_1",
        "selec_2",
        "selec_3",
        "selec_boss",
        "arrow_r",
        "arrow_l",
        "bose_s_b",
        "wood_1_walk",
        "wood_2_walk",
        "wood_3_walk",
        "btn123",
        "btn123_w",
        "foot_l_a",
        "foot_r_a",
        "interval",
        "role_arrow",
        "kulou",
        "selected"

    ],
    soundNames = [
        //'cow',
        //'bg'
    ];



var cav = document.getElementById("canvas");

var iphone = navigator.userAgent.indexOf("iphone");

//go with HTML5 audio
soundManager.useHTML5Audio = true;
soundManager.preferFlash = false;
//soundManager.reboot();

window.addEventListener('load',function(){
    document.body.addEventListener("click", function(e){
        e.preventDefault();
    },false);
    
    soundManager.onready(function() {
        init();
    });

    //绑定重启
    document.getElementById("restart").onclick = function(){
        socket.emit("restart");
    }
});



function init(){
    //console.log("start init...");
    initLoader(function (){
        console.log("All source loaded");
        //init canvas after source loaded
        initDraw();


    });
}

function switchRole(){


    console.log(Role.current);
    if(Role.current){
//        console.log(Role.current);
        switch(Role.current){
            case 'screen':
                break;
            case 'wooder':
                initWooder();
                break;
            case 'boss':
                initWatcher();
                break;
            default :
                break;
        }
    }else{
        //console.log('sorry! can not connect the server!')
    }
}

//记录上次点击的地方
var clickAreaRecord = [];
function initWooder(){


    var d_canvas = document.getElementById('canvas');
    if("ontouchstart" in window){
        d_canvas.addEventListener('touchstart',function(e){

            var point  = {};
            point.x = e.targetTouches[0].pageX;
            point.y = e.targetTouches[0].pageY;

            var clickArea;

            if(point.x > d_canvas.width/2){
                clickArea = 'right';
            }else{
                clickArea = 'left';
            }

            UI["walk_" + clickArea + "_start"] && UI["walk_" + clickArea + "_start"](); 


            if(clickArea){
                if(clickAreaRecord.length === 0){
                    clickAreaRecord.push(clickArea);
                }else if(clickAreaRecord.length === 1){
                    if(clickAreaRecord[0] !== clickArea){
                        //发送一个点击信息。
    //                console.log(Role.id);
                        socket.emit('walk',{'roleId' : Role.id});
                        clickAreaRecord = [];
                    }
                }else{
                    clickAreaRecord = [];
                }
            }

        },false);

        d_canvas.addEventListener('touchend', function(){

            var point  = {};
            point.x = e.targetTouches[0].pageX;
            point.y = e.targetTouches[0].pageY;

            var clickArea;

            if(point.x > d_canvas.width/2){
                clickArea = 'right';
            }else{
                clickArea = 'left';
            }

            UI["walk_" + clickArea + "_end"] && UI["walk_" + clickArea + "_end"](); 

        })
    }else{
        document.onkeydown = function(e){
            var clickArea;
            switch(e.keyCode){
                case 65:
                    clickArea = 'left';
                    break;
                case 68:
                    clickArea = 'right';
                    break;
            }
            UI["walk_" + clickArea + "_start"] && UI["walk_" + clickArea + "_start"](); 

        };
        document.onkeyup = function(e){
            var clickArea;
            switch(e.keyCode){
                case 65:
                    clickArea = 'left';
                    break;
                case 68:
                    clickArea = 'right';
                    break;
            }
            UI["walk_" + clickArea + "_end"] && UI["walk_" + clickArea + "_end"](); 

            if(clickArea){
                if(clickAreaRecord.length === 0){
                    clickAreaRecord.push(clickArea);
                }else if(clickAreaRecord.length === 1){
                    if(clickAreaRecord[0] !== clickArea){
                        //发送一个点击信息。
    //                console.log(Role.id);
                        socket.emit('walk',{'roleId' : Role.id});
                        clickAreaRecord = [];
                    }
                }else{
                    clickAreaRecord = [];
                }                
            }

        };

    }
}



function initWatcher(){
    //setInterval(function(){
        showDraw123();
    //},5000);
}



function onloading(prog){
    //show loading
    document.getElementById("progInfo").innerHTML = prog;
}

//init loading images&sounds
function initLoader(callback){


    var loader = new PxLoader();

    var i, len, url;

    // queue each sound for loading
    for(i=0, len = soundNames.length; i < len; i++) {

        // see if the browser can play m4a
        url = 'music/' + soundNames[i] + '.mp3';
        if (!soundManager.canPlayURL(url)) {
            // ok, what about ogg?
            url = 'music/' + soundNames[i] + '.aac';
            if (!soundManager.canPlayURL(url)) {
                continue; // can't be played
            }
        }

        // queue the sound using the name as the SM2 id
        loader.addSound(soundNames[i], url);
    }

    var imgHolder;
    //queue each image for loading
    for(var n=0, nmax = imgsrc.length; n<nmax; n++){
        imgHolder = new PxLoaderImage("img/"+ imgsrc[n] + ".png");
        imgHolder.name = imgsrc[n];
        loader.add(imgHolder);
    }

    // listen to load events
    loader.addProgressListener(function(e) {

        if(e.resource.sound){
            var soundId = e.resource.sound.sID;
            console.log("sound " + soundId + " loaded");
            sound[soundId] = function(){
                var id = soundId;
                return {
                    play : function(){
                        soundManager.play(id, {
                            onfinish: function() {
                                sound[soundId].play();
                            }
                        });
                    }
                }
            }();
        }
        else if(e.resource.img){
            var imgId = e.resource.name;
            console.log("image " + e.resource.name + " loaded");
            img[imgId] = e.resource.img;
        }

        onloading(parseInt(e.completedCount * 100/e.totalCount, 10) );


    });

    // callback that will be run once images are ready
    loader.addCompletionListener(function() {
        callback && callback();
    });

    loader.start();

}
//当屏幕发生转动
window.onorientationchange = function(){
    updateOrientation();
}

//test the screen orientation
function updateOrientation(){
    switch(window.orientation)
    {
        case 0:
            console.log('');
            break;
        case -90:
            console.log('right, screen turned clockwise');
            break;
        case 90:
            console.log('left, screen turned counterclockwise');
            break;
        case 180:
            console.log('upside-down portrait');
            break;
    }
}

