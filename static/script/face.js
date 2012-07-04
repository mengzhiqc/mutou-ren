//事先加载好图片
var canvas, stage, w, h;


var animHolder = [];


//安全push
Array.prototype.onepush = function(obj){
    var index = this.indexOf(obj);
    if(index === -1){
        this.push(obj);
    }
    return this;
}

//删除
Array.prototype.dele = function(obj){
    var index = this.indexOf(obj);
    if(index !== -1){
        this.splice(index, 1);
    }
    return this;
}

//<<------------extend 动画-------------
DisplayObject.prototype.anim = function(type, value, step, callback){
    if(!this._anim_){
        this._anim_ = [];
        this._anim_.animNum = 0;
    }
    if(!this._anim_[type]){
        this._anim_.animNum++;
    }
    this._anim_.onepush(type);
    this._anim_[type] = {
        fn:callback,
        start : this[type],
        end : value,
        delt:value - this[type],
        step: step,
        now : 0
    };
    animHolder.onepush(this);
}


function animEase(value){
    return (Math.sqrt(value * 4)) / 2;
}

function onAnimTick(){
    var thisElem, animObj, type;
    for(var n=0, nmax=animHolder.length;n < nmax; n++){
        thisElem = animHolder[n];
        //倒序
        for(var i=thisElem._anim_.length - 1; i >=0; i--){
            type = thisElem._anim_[i];
            animObj = thisElem._anim_[type];
            animObj.now++;
            thisElem[type] = animObj.delt * animEase( animObj.now / animObj.step) + animObj.start;

            if(animObj.now >= animObj.step){
                thisElem._anim_[type] = null;
                thisElem._anim_.dele(type);
                thisElem._anim_.animNum--;
                if(!thisElem._anim_.animNum){
                    animHolder.dele(thisElem);
                }
                setTimeout(function(){

                animObj.fn && animObj.fn(thisElem);
                })
            }
        }
    }
}
//--------------extend 动画------------->>


var woodManId = 0,
    woodManNum = 3,
    woodMan = {},
    bossMan,
    scene = {
        start:null,
        enter : null,
        main : null,
        select : null,
        win : null
    },
    sceneNow = null,
    clickInterval = 6000,
    bossState = "back",
    bossHasInit = false,
    hasInitDraw = false;

function initDraw(){
    if(hasInitDraw) return;

    //find canvas and load images, wait for last image to load
   	canvas = document.getElementById("canvas");

    var center = document.getElementById("center");
    var ProgBar = document.getElementById("progBar");

    if(!iphone && false){
        center.style.width = 640;
        center.style.height = 900;
        ProgBar.style['width'] = 640;
        ProgBar.style['height'] = 900;

        //保证按比例
        canvas.width = 640;
        canvas.height = 960;
    }
    else{
        center.style.height = ProgBar.style['height'] = canvas.height = innerHeight;
        center.style.width = ProgBar.style['width'] = canvas.width = innerHeight * 2 / 3;
    }

    ProgBar.style['display'] = '';

   	// create a new stage and point it at our canvas:
   	stage = new Stage(canvas);


	//Touch.enable(stage);

    w = canvas.width;
    h = canvas.height;


    stage.scaleX = stage.scaleY = canvas.height/960;
    console.log("w:" + w + " h:" + h);
    console.log("scale:" + stage.scaleX);


    var nI;
    for(var n=0,nmax=woodManNum; n<nmax; n++){
        nI = n+1;
        woodMan[n] = {};
        woodMan[n].img = {
            small_back:img["wood_" + nI + "s_b"],
            small_face:img["wood_" + nI + "s_f"],
            big:img["wood_" + nI + "b"]
        }
    }
    bossMan = {};
    bossMan.img = {
            small_back:img.bose_s_0,
            small_side:img.bose_s_1,
            small_face:img.bose_s_2,
            big:img.bose_b
    }


    drawMap();

    //连接socket服务器
    connectSocket();

    hasInitDraw = true;
}



function drawMap(){
    for(name in scene){
        scene[name] = new Container();
        scene[name].visible = false;
        stage.addChild(scene[name]);
    }

    prepareScene();

    Ticker.addListener(window);
    Ticker.useRAF = true;
    // Best Framerate targeted (60 FPS)
    Ticker.setInterval(17);




    //进入选择入口场景
    UI.scene("start");
    sound.bg.play();
}


function prepareScene(){




    //<<-------------win
    var bg = new SpriteSheet({
        // image to use
        images: [img.win_bg],
        // width, height & registration point of each sprite
        frames: {width: 640, height: 960, regX: 0, regY: 0},
        animations: {
            idle: [0, 1, "idle", 32]
        }
    });

    var bfAnim = new BitmapAnimation(bg);
    bfAnim.gotoAndPlay("idle");
    scene.win.addChild(bfAnim);

    scene.win.bossMan = new Bitmap(bossMan.img.big);
    scene.win.bossMan.regX = 250;
    scene.win.bossMan.regY = 250;
    scene.win.bossMan.x = 320;
    scene.win.bossMan.y = 480;
    scene.win.bossMan.visible = false;
    scene.win.addChild(scene.win.bossMan);

    scene.win.woodMan = [];
    for(var n = 0, nmax = woodManNum; n<nmax; n++){
        scene.win.woodMan[n] = new Bitmap(woodMan[n].img.big);
        scene.win.woodMan[n].regX = 250;
        scene.win.woodMan[n].regY = 250;
        scene.win.woodMan[n].x = 320;
        scene.win.woodMan[n].y = 480;
        scene.win.woodMan[n].visible = false;
        scene.win.addChild(scene.win.woodMan[n]);
    }
    //win--------->>


    //<<-------------main
    var bg = new SpriteSheet({
        // image to use
        images: [img.hongxing],
        // width, height & registration point of each sprite
        frames: {width: 640, height: 960, regX: 0, regY: 0},
        animations: {
            idle: [0, 1, "idle", 32]
        }
    });

    var bfAnim = new BitmapAnimation(bg);

    bfAnim.gotoAndPlay("idle");
    scene.main.addChild(bfAnim);

    var s;
    scene.main.alert = [];
    for(var n=0;n < 3; n++){
        s = drawOne();
        scene.main.alert.push(s);
        s.scaleX = 0.7;
        s.scaleY = 0.7;
        s.x = 120 + 160 * n;
        s.y = 50;
        s.visible = false;
        scene.main.addChild(s);
    }
    //main-------------->>


    //<<---------enter
    /*
    var bg = new SpriteSheet({
        // image to use
        images: [img.hongxing],
        // width, height & registration point of each sprite
        frames: {width: 640, height: 960, regX: 0, regY: 0},
        animations: {
            idle: [0, 1, "idle", 32]
        }
    });

    var bfAnim = new BitmapAnimation(bg);

    bfAnim.gotoAndPlay("idle");
    bfAnim.alpha = 0.3;
    scene.enter.addChild(bfAnim);
    scene.enter.focusRole = {};

    scene.enter.woodMan = [];
    for(var n=0, nmax = woodManNum; n<nmax; n++){
        scene.enter.woodMan[n] = new Bitmap(woodMan[n].img.small_face);
        scene.enter.woodMan[n].regX = 94;
        scene.enter.woodMan[n].regY = 214;
        scene.enter.woodMan[n].x = 250 + 150*n;
        scene.enter.woodMan[n].y = 600;
        scene.enter.woodMan[n].scaleX = 0.6;
        scene.enter.woodMan[n].scaleY = 0.6;
        scene.enter.woodMan[n].onClick = function(name){
            return function(){
                roleSelete(name);

                //hide all small role
                for(var n=0, nmax = woodManNum; n<nmax; n++){
                    scene.enter.woodMan[n].visible = false;
                }
                scene.enter.bossMan.visible = false;

                //show focus big role
                scene.enter.focusRole.woodMan[name].visible = true;
            }
        }(n);
        scene.enter.addChild(scene.enter.woodMan[n]);


        scene.enter.addChild(scene.win.woodMan[n]);
    }
    scene.enter.focusRole.woodMan = [];
    for(var n = 0, nmax = woodManNum; n<nmax; n++){
        scene.enter.focusRole.woodMan[n] = new Bitmap(woodMan[n].img.big);
        scene.enter.focusRole.woodMan[n].regX = 250;
        scene.enter.focusRole.woodMan[n].regY = 250;
        scene.enter.focusRole.woodMan[n].x = 320;
        scene.enter.focusRole.woodMan[n].y = 480;
        scene.enter.focusRole.woodMan[n].visible = false;
        scene.enter.addChild(scene.enter.focusRole.woodMan[n]);
    }


    scene.enter.bossMan = new Bitmap(bossMan.img.small_face);
    scene.enter.bossMan.x = 100;
    scene.enter.bossMan.y = 600;
    scene.enter.bossMan.regX = 60;
    scene.enter.bossMan.regY = 128;
    scene.enter.bossMan.onClick = function(){
        //return function(){
            roleSelete("boss");

            //hide all small role
            for(var n=0, nmax = woodManNum; n<nmax; n++){
                scene.enter.woodMan[n].visible = false;
            }
            scene.enter.bossMan.visible = false;

            //show focus big role
            scene.enter.focusRole.bossMan.visible = true;
        //}

    }
    scene.enter.addChild(scene.enter.bossMan);




    scene.enter.focusRole.bossMan = new Bitmap(bossMan.img.big);
    scene.enter.focusRole.bossMan.regX = 250;
    scene.enter.focusRole.bossMan.regY = 250;
    scene.enter.focusRole.bossMan.x = 320;
    scene.enter.focusRole.bossMan.y = 480;
    scene.enter.focusRole.bossMan.visible = false;




    scene.enter.addChild(scene.enter.focusRole.bossMan);
*/

    //enter------------>>

    //<<-------------start
    scene.start.bg = new Bitmap(img.start_bg);
    scene.start.addChild(scene.start.bg);
    scene.start.bg.onClick = function (){
        UI.scene("select");
    }
    scene.start.play_b = new Text("Click to play", "64px bold Arial", "#EC5955");
    scene.start.play_b.x = 160;
    scene.start.play_b.y = 460;
    scene.start.play_w = new Text("Click to play", "64px bold Arial", "#FFF");
    scene.start.play_w.x = 160;
    scene.start.play_w.y = 460;
    scene.start.addChild(scene.start.play_b);
    scene.start.addChild(scene.start.play_w);

    //start-------------->>

    //<<------------select
    scene.select.bg = new Bitmap(img.selec_bg);
    scene.select.addChild(scene.select.bg);

    /*
    scene.select.focusRole = {};

    scene.select.woodMan = [];
    for(var n=0, nmax = woodManNum; n<nmax; n++){
        scene.select.woodMan[n] = new Bitmap(woodMan[n].img.small_face);
        scene.select.woodMan[n].regX = 94;
        scene.select.woodMan[n].regY = 214;
        scene.select.woodMan[n].x = 250 + 150*n;
        scene.select.woodMan[n].y = 600;
        scene.select.woodMan[n].scaleX = 0.6;
        scene.select.woodMan[n].scaleY = 0.6;
        scene.select.woodMan[n].onClick = function(name){
            return function(){
                roleSelete(name);

                //hide all small role
                for(var n=0, nmax = woodManNum; n<nmax; n++){
                    scene.select.woodMan[n].visible = false;
                }
                scene.select.bossMan.visible = false;

                //show focus big role
                scene.select.focusRole.woodMan[name].visible = true;
            }
        }(n);
        scene.select.addChild(scene.select.woodMan[n]);


    }



    scene.select.bossMan = new Bitmap(bossMan.img.small_face);
    scene.select.bossMan.x = 100;
    scene.select.bossMan.y = 600;
    scene.select.bossMan.regX = 60;
    scene.select.bossMan.regY = 128;
    scene.select.bossMan.onClick = function(){
        //return function(){
            roleSelete("boss");

            //hide all small role
            for(var n=0, nmax = woodManNum; n<nmax; n++){
                scene.select.woodMan[n].visible = false;
            }
            scene.select.bossMan.visible = false;

            //show focus big role
            scene.select.focusRole.bossMan.visible = true;
        //}

    }
    scene.select.addChild(scene.select.bossMan);



    scene.select.focusRole.woodMan = [];
    for(var n = 0, nmax = woodManNum; n<nmax; n++){
        scene.select.focusRole.woodMan[n] = new Bitmap(woodMan[n].img.big);
        scene.select.focusRole.woodMan[n].regX = 250;
        scene.select.focusRole.woodMan[n].regY = 250;
        scene.select.focusRole.woodMan[n].x = 320;
        scene.select.focusRole.woodMan[n].y = 480;
        scene.select.focusRole.woodMan[n].visible = true;
        scene.select.addChild(scene.select.focusRole.woodMan[n]);
    }




    scene.select.focusRole.bossMan = new Bitmap(bossMan.img.big);
    scene.select.focusRole.bossMan.regX = 250;
    scene.select.focusRole.bossMan.regY = 250;
    scene.select.focusRole.bossMan.x = 320;
    scene.select.focusRole.bossMan.y = 480;
    scene.select.focusRole.bossMan.visible = false;
    scene.select.addChild(scene.select.focusRole.bossMan);
*/

    scene.select.cover = new Bitmap(img.selec_cover);
    scene.select.cover.y = 960 - 196;
    scene.select.addChild(scene.select.cover);


    scene.select.choose = new Bitmap(img.selected);
    scene.select.choose.visible = false;
    scene.select.addChild(scene.select.choose);
    //select--------------->>




}

function startFlashPlay(){
    if(scene.start.play_w.alpha == 0){
        scene.start.play_w.anim("alpha", 1, 60, startFlashPlay);
    }
    else{

    scene.start.play_w.anim("alpha", 0, 60, startFlashPlay);
    }

}

function stopFlashPlay(){
    animHolder.dele(scene.start.play_w);
}

function roleSelete(name){
    console.log("selected '" + name + "'");
    UI.roleSelete(name);
}


function disableSelete(name){
    if(name === "boss"){
        scene.select.bossMan.alpha = 0.4;
        scene.select.bossMan.onClick = null;
    }
    else{
        scene.select.woodMan[name].alpha = 0.4;
        scene.select.woodMan[name].onClick = null;
    }
    console.log("disable '" + name + "'");
}



function showScene(sName){
    if(scene[sName]){
        for(name in scene){
            scene[name].visible = false;
        }
        scene[sName].visible = true;
    }
    sceneNow = sName;
    if(sName === "start"){
        startFlashPlay();
    }
    else{
        stopFlashPlay();
    }
    UI.active(sName);
    console.log("In scene '" + sName + "'");
}

function addBoss(){
    if(bossHasInit) return;
    var boss = new SpriteSheet({
           // image to use
           images: [bossMan.img.small_back],
           // width, height & registration point of each sprite
           frames: {width: 120, height: 128, regX: 60, regY: 64},
           animations: {
               idle: [0, 2, "idle", 32]
           }
       });

    var bossBackAnim = new BitmapAnimation(boss);
    bossMan.back = bossBackAnim;
    bossBackAnim.gotoAndPlay("idle");
    scene.main.addChild(bossBackAnim);
    //bossBackAnim.shadow = new Shadow("#454", 0, 0, 4);
    bossBackAnim.x = 320;
    bossBackAnim.y = 225;
    //bossBackAnim.visible = false;


    var man = new Bitmap(bossMan.img.small_side);
    bossMan.side = man;
    //bossMan.side.shadow = new Shadow("#454", 0, 0, 4);
    bossMan.side.regX = 60;
    bossMan.side.regY = 64;
    bossMan.side.y = 225;
    bossMan.side.x = 320;
    man.visible = false;
    scene.main.addChild(man);

    var faceman = new Bitmap(bossMan.img.small_face);
    bossMan.face = faceman;
    //bossMan.side.shadow = new Shadow("#454", 0, 0, 4);
    bossMan.face.regX = 60;
    bossMan.face.regY = 64;
    bossMan.face.y = 225;
    bossMan.face.x = 320;
    faceman.visible = false;
    scene.main.addChild(faceman);

    bossHasInit = true;

    console.log("Boss come in! attention.")
}

function showBoss(type){
    var iAmBoss = Role.current = "watcher";
    bossState = type;
    bossMan.back.visible = bossMan.face.visible = bossMan.side.visible = false;
    if(type === "back"){
        bossMan.back.visible = true;
        if(iAmBoss){
            alphaWood(0, 0.2);
            alphaWood(1, 0.2);
            alphaWood(2, 0.2);
        }

        bossStopLR();
    }
    else if(type === "side"){
        bossMan.side.visible = true;
        if(iAmBoss){
            alphaWood(0, 0.2);
            alphaWood(1, 0.2);
            alphaWood(2, 0.2);
        }
        bossStartLR();
    }
    else if(type === "face"){
        bossMan.face.visible = true;
        alphaWood(0, 1);
        alphaWood(1, 1);
        alphaWood(2, 1);
        bossStopLR();
    }
    console.log("Boss turn " + type);
}


function addWood(n){

    if(n > 2 || woodMan[n].face){
        return;
    }
    var man = new Bitmap(woodMan[n].img.small_face);
    woodMan[n].face = man;
    woodMan[n].face.y = woodMan[n].oriY = 945;
    woodMan[n].face.x = woodMan[n].oriX = 10 + 210*n;
    woodMan[n].face.regX = 94;
    woodMan[n].face.regY = 214;
    woodMan[n].face.x = 100 + 220*n;
    woodMan[n].face.visible = false;

    var backman = new Bitmap(woodMan[n].img.small_back);
    woodMan[n].back = backman;
    woodMan[n].back.regX = 94;
    woodMan[n].back.regY = 214;
    woodMan[n].back.y = 945;
    woodMan[n].back.x = 100 + 220*n;

    woodMan[n].dis = 0;

    scene.main.addChild(backman);
    scene.main.addChild(man);

    console.log("Woodman " + n + "come in!");
}


function alphaWood(n, alpha){
    woodMan[n].face && (woodMan[n].face.alpha = woodMan[n].back.alpha = alpha);
}
function showWood(n, dis){
    setWoodParam(n, "dis", dis);
    setWood(n, "visible", false);
    if(woodMan[n].over){
        alphaWood(n, 1);
        woodMan[n].face.visible = true;
    }
    else{
        //alphaWood(n, 1);
        woodMan[n].back.visible = true;
    }
    var scaleValue = 1 - dis*0.004,
        yValue = woodMan[n].oriY - dis*5.85;

    setWood(n, "y", yValue);
    setWood(n, "scaleX", scaleValue);
    setWood(n, "scaleY", scaleValue);
    setWoodParam(n, "scaleY", 1 - dis*0.004);

}
//设置图形显示属性
function setWood(n, type, value){
    woodMan[n].face[type] = woodMan[n].back[type] = value;
}
//获取参数
function getWoodParam(n, type){
    return woodMan[n][type];
}
//设置参数
function setWoodParam(n, type, value){
    woodMan[n][type] = value;
}

var jumping = [false, false, false];

function jumpWood(n, dis){
    if(!woodMan[n].over && getWoodParam(n, "dis") != dis){
        jumping[n] = true;

        showWood(n, dis);
        woodMan[n].jumpState = woodMan[n].jumpState ? woodMan[n].jumpState : 0;
        if(!woodMan[n].jumpState){
            setWood(n, "scaleY", getWoodParam(n, "scaleY")*1.05);
        }
        else if(woodMan[n].jumpState === 1){
            setWood(n, "scaleY", getWoodParam(n, "scaleY")*1.08);
        }
        else if(woodMan[n].jumpState === 2){
            setWood(n, "scaleY", getWoodParam(n, "scaleY")*1.05);
            setWood(n, "y", woodMan[n].oriY - (getWoodParam(n, "dis") + 1)*5.85);
        }
        else if(woodMan[n].jumpState === 3){
            setWood(n, "scaleY", getWoodParam(n, "scaleY"));
            setWood(n, "y", woodMan[n].oriY - (getWoodParam(n, "dis") + 3)*5.85);
        }
        else if(woodMan[n].jumpState === 4){
            setWood(n, "scaleY", getWoodParam(n, "scaleY"));
            setWood(n, "y", woodMan[n].oriY - (getWoodParam(n, "dis") + 2)*5.85);
        }
        else if(woodMan[n].jumpState === 5){
            showWood(n, dis);

        }

        //setWood(n, "scaleX", 1);
        //setWood(n, "x", woodMan[n].oriX);

        woodMan[n].jumpState++;
        //console.log("jumpState:" + woodMan[n].jumpState);
        //下一斟继续执行动画
        if(woodMan[n].jumpState < 6){
            tickState.push(function(){
                jumpWood(n, dis);
            });
        }
        else{
            woodMan[n].jumpState = 0;
            jumping[n] = false;
        }

    }
    else{
        showWood(n, getWoodParam(n, "dis"));
        jumping[n] = false;
    }

    console.log("Woodman " + n + " run to " + dis);

}

//动画队列
var tickState = [], tickInterval = 3, tickN = 0,
    bossTick = [];

function ontick(){
    if(tickN >= tickInterval){
        var fn = tickState.shift();
            fn && fn();

        fn = bossTick.shift();
        fn && fn();
        tickN = 0;
        //console.log("ontick");
    }
    tickN++;

}

function bossRadom(){
    var radom = Math.random();
    if(radom > 0.6){
            bossMan.back.visible = false;
            bossMan.side.visible = true;
        bossMan.side.scaleX = -1;
    }
    else if(radom <= 0.6 && radom >= 0.3){
            bossMan.back.visible = false;
            bossMan.side.visible = true;
        bossMan.side.scaleX = 1;
    }
    else{
        bossMan.back.visible = true;
        bossMan.side.visible = false;
    }

}

function bossStartLR(){
    bossTick.push(function(){
        bossRadom();
        bossTick.push(bossStartLR);
    });
}

function showAlert123(i){

    //显示 123 的预警
    for(var n=0, nmax = scene.main.alert.length; n<nmax; n++){
        if(n + 1 <= i){
            scene.main.alert[n].visible = true;
        }
        else{
            scene.main.alert[n].visible = false;
        }
    }
    console.log("Alert " + num);
}
function hideAlert123(){
    //隐藏 123 的预警
    for(var n=0, nmax = scene.main.alert.length; n<nmax; n++){
            scene.main.alert[n].visible = false;
    }
    console.log("Alert clear");
}


function bossStopLR(){
    bossTick = [];
}

var hasDraw123;

function drawOne(){
    var s = new Shape();
    var g = s.graphics;
    //Head
    g.setStrokeStyle(2, 'round', 'round');
    g.beginStroke(Graphics.getRGB(0, 0, 0));
    g.beginFill(Graphics.getRGB(255, 255, 0));
    g.drawCircle(60, 60, 60); //55,53
    g.endFill();
    g.setStrokeStyle(1, 'round', 'round');
    return s;
}

function radomDraw123(){
    var rt = [[getR(),getR()],[getR(),getR()],[getR(),getR()]];
    function getR(){
        return Math.random() * 560;
    }
    return rt;
}

var drawClick = [], drawTime = null;

function showDraw123(){
    if(drawTime){return};

    var pos = radomDraw123(), s, firstClick = false, clickIndex = 0;

    //console.log(pos);
    if(!hasDraw123){
        for(var n=0;n<3;n++){
            s = drawOne();

            s.x = pos[n][0];
            s.y = pos[n][1];
            //console.log(s.x);
            //console.log(s.y);
            drawClick.push(s);

            scene.main.addChild(s);
        }
    }
    else{
        for(var n=0;n<3;n++){
            drawClick[n].x = pos[n][0];
            drawClick[n].y = pos[n][1];
            drawClick[n].visible = true;
        }
    }

    for(var n=0;n<3;n++){
        drawClick[n].onClick = (function(num){
            return function(){
                clickIndex++;
                if(clickIndex <= 3){
                    if(!firstClick){
                        onFirstClick();
                        firstClick = true;
                    }

                    onClick123(clickIndex);

                    //console.log("click a 123");
                    drawClick[num].visible = false;
                    if(checkIfClickAll()){
                        onClickAll123();
                    }
                }
            }
        })(n);
    }

    clearTimeout(drawTime);

    drawTime = setTimeout(function(){
        hideDraw123();
        drawTime = null;
    }, clickInterval);




    hasDraw123 = true;

    console.log("ok! let`s start 123 to kill them");
}

function hideDraw123(){

    for(var n=0;n<3;n++){
        drawClick[n].visible = false;
    }
    onClickAll123Timeout();
    showBoss("back");
    console.log("cancel 123, again");
}

function onFirstClick(){
    //socket.emit('willingBegin','1');
}


function onClick123(n){
    //开始点击123 的第 n 次
    UI.bossClick(n);
    console.log("boss click " + n);
}

function onClickAll123(){
    //socket.emit('confirmTurn','1');
//    console.log("onClickAll123");
}

function onClickAll123Timeout(){
    //超过了5秒没有能点击完成 123的回调
    UI.bossCancleClick();
    console.log("boss cancel click");
}

function checkIfClickAll(){
    var all = true;
        for(var n=0;n<3;n++){
            if(drawClick[n].visible){
                all = false;
            }
        }
    return all;
}

function showWin(man){
    scene.win.bossMan.visible = false;
    for(var n = 0, nmax = woodManNum; n<nmax; n++){
        scene.win.woodMan[n].visible = false;
    }
    if(man === "boss"){
        scene.win.bossMan.visible = true;
    }
    else{
        scene.win.woodMan[man].visible = true;
    }

    console.log(man  + " Win!");

}

function overWood(n){
    woodMan[n].over = true;
}










//状态函数
function tick() {
    for(var n=0;n<3;n++){
        if(woodMan[n].over){
            showWood(n, getWoodParam(n, "dis"));
        }
    }
    ontick();


    onAnimTick();
    // update the stage:
    stage.update();
}
