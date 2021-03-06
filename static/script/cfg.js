var cfg = {};

cfg.socket = {};
cfg.socket.host = 'http://' + location.hostname + ':3000';
//cfg.socket.host = 'http://192.168.2.2:3000';

var gameParam = {};

//角色
var Role = {};

//当前的角色，‘wooder’木头人、‘watcher’数数者、‘screen’屏幕
Role.current = null;
Role.id = null;//只有木头人才有的id
Role.currentSessionID = null; //刷新后重新获取的sessionID


//客户端监听的接口定义
//character : 角色 [1p-主机，all-所有的,system-系统的]

//statge : 分为 loading，choose，select，main,finish
    //loading为刚载入游戏。
    //choose 为选择游戏 --单机游戏，联机游戏，创建房间，加入房间等
    //select 为选择角色
    //main 为游戏场景
    //finish 为游戏结束


//全局定义。默认返回的参数格式为json。
//{
// code : 1,//1为正常情况，-1为异常情况。其他返回码自定义
// data : ''//返回的东西根据实际情况。
// }

var INTERFACES_ON = {
    'connect' : {
        'character' : 'system',
        'role' : '',
        'desc' : '默认事件，当与服务器连上之后会立即触发。',
        'statge' : 'loading',
        'broadcast' : false
    },
    'availablePerson' : {
    	'character' : 'system',
    	'role' : '',
    	'desc' : '检查当前可选人物',
    },
    'addPerson' : {
    	'desc' : '添加用户，若collection为空，表明未初始化，返回noinit，如果gameParams.collection.wooder长度大于2 \
    	表明人数已满，返回－1,其他，返回添加的用户对象'
    } ,
//    'playerNum' : {
//        'character' : '',
//        'role' : '',
//        'desc' : '获得当前连接到服务器的人数',
//        'statge' : 'choose',
//        'broadcast' : true
//    },
//    'roomNum' : {
//        'character' : '',
//        'role' : '',
//        'desc' : '获得当前服务器上的房间数量',
//        'statge' : 'choose',
//        broadcast : true
//    },
    'start' : {
        'character' : '1p',
        'role' : 'all',
        'desc' : '给服务器发送开始游戏的事件。',
        'statge' : 'select',
        'broadcast' : false
    },
    'disconnect' : {
        'character' : 'system',
        'role' : '',
        'statge' : '',
        'desc' : '默认事件，当与服务器断开连接时触发。',
        'broadcast' : false
    },
    'returnPositionInfo' : {
        'character' : 'all',
        'role'  : 'all',
        'statge' : 'main',
        'desc'  : '返回木头人当前的位置。',
        'broadcast' : true
    },
    'initGames' : {
        'desc' : '初始化服务器'
    },
    'raiseException' : {
        'desc' : '服务器异常。'
    },
    'success' : {
        'desc' : '成功连接至服务器。'
    },
    'alert' : {
        'desc' : '从服务端返回的alert信息。直接传回alert的内容。'
    },
    'win' : {
        'desc' : 'some has win the game'
    },
    'restart' : {
        'desc' : '重启游戏'
    },
    'remainTime' : {
        'desc' : '得到剩余的倒计时。'
    },
    'timeUp' : {
        'desc' : '时间到。'
    },
};

//客户端发送的接口定义
var INTERFACES_EMIT = {
    'ready' : {
        'params' : null,
        'desc'   : '告诉服务器已经做好准备。'
    },
	'availablePerson' : {
	     'params' : null,
    	 'desc' : '获取可用角色'
     },  
    'addPerson' : {
        'params' : {
            'roleId' : 'number'
        },
		'desc' : '添加一个用户'	
    },
	'walk' : {
		'params' : {
			'roleId' : 'number'
		},
		'desc' : '角色跑动事件'
	},
	'willingBegin' : {
		'params' : 'number',
		'desc' : '转头开始'
	},
    'willing' : {
        'params' : 'number',
        'desc' : '转头开始'
    },
    "willingCancel" : {
        "params" : "number",
        "desc" : "取消转头"
    },
	'confirmTurn' : {
		'params' : 'number',
		'desc' : '确认转头'
	},
	'disconnect' : {
		'params' : null,
		'desc' : '失去链接'
	},
    'restart'    : {
        'params' : null,
        'desc'   : '发送重启的指令'
    }
}


//可选角色。
//为数组分别是
var selectableRole = [false,true,true,true];

//前端可以调用的接口。
var UI = {

    /** 显示场景
     * @param {String} sceneName 场景名，目前四个“start”, "select",  "main", "win"
     */
    scene : function(sceneName){
        showScene(sceneName);
    },
    /** 回调函数，当进入某个场景后回调
     *  @param {String} sceneName 场景名，目前四个“start”, "select",  "main", "win"
     */
    active : function(sceneName){
        //some code
        console.log(sceneName);
        switch(sceneName){
            case 'select':
                console.log('here');
                socket.emit('ready');
                socket.emit('availablePerson');
                break;
            case 'main':

                break;
        }
    },
    /**
     * win场景中，显示胜利者
     * @param {String|Number} name 角色id，“boss”｜0｜1｜2
     */
    win : function(name){
        showWin(name);
    },
    /**
     * 在选择角色时禁止某个角色的选择
     * @param {String|Number} name 角色id，“boss”｜0｜1｜2
     */
    disableSelete : function(name){
        disableSelete(name);
    },
    /**
     * 在游戏场景中，添加boss
     */
    addBoss : function(){
        addBoss();
    },
    /** 显示boss的状态
     * @param {String} name 状态名，目前就三个 正面“face”, 侧面"side", 背面"back"
     */
    showBoss : function(name){
        showBoss(name);
    },
    /**
     * 在游戏场景中，添加木头人
     * @param {Number} id 木头人的id
     */
    addWood : function(id){
        addWood(id);
    },
    /** 更新木头人的位置
     * @param {Number} id 木头人的id
     * @param {Number} distance 0~100的数值，0是起点，100是终点
     */
    jumpWood : function(id, distance){
        jumpWood(id, distance);
    },
    /**
     * 木头人客户端预警boss 在数 1 ， 2，  3
     * @param {number} num 预警数数
     */
    woodAlert123 : function(num){
        showAlert123(num);
    },
    /** 木头人客户端清除 1 2 3的警告
     */
    woodAlertClear : function(){
        hideAlert123();
    },
    /** boss开始出现123数数按钮
     */
    bossStartClick : function(){
        showDraw123();
    },
    /** 回调函数，boss客户端开始
     * @param {Number} n 预警数
     */
    bossClick :function (n){
        socket.emit("willing", n.toString());

        // if( n == 1){
        //     socket.emit('willingBegin','1');
        // }
        // else if(n == 3){
        //     socket.emit('confirmTurn','1');
        // }
    },
    /**
     * 回调函数，boss没有在一轮数数中 数到3
     */
    bossCancleClick : function(){
        //some code
        socket.emit('willingCancel','1');
    },
    /**
     *  木头人死亡
     * @param  @param {Number} id 木头人的id
     */
    over: function(id){
        overWood(id);
    },

    /** 回调函数，当用户选择角色时触发
     * @param {String|Number} name 角色id，“boss”｜0｜1｜2
     */
    roleSelete : function(name){
        if(name !== "boss"){
            scene.main.foot_r.visible = true;
            scene.main.foot_l.visible = true;


        }
        Role.id = "boss";

        //some code...
        switch(name){
            case 'boss' :
                console.log('add boss??');
                socket.emit('addPerson',{'roleId':-1});
                Role.current = "boss";

                break;
            case 0:
                socket.emit('addPerson',{'roleId':1});
                Role.current = "boss";
                Role.id = 1;
                break;
            case 1:
                socket.emit('addPerson',{'roleId':2});
                Role.current = "boss";
                Role.id = 2;
                break;
            case 2:
                socket.emit('addPerson',{'roleId':3});
                Role.current = "boss";
                Role.id = 3;
        }

        UI.scene("main");

    },
    time:function(num){
        setTimestep(num);
    },
    //行走的视觉提示
    walk_right_start:function(){
        scene.main.foot_r.alpha = 1;
        scene.main.addChild(scene.main.foot_r);
    },
    walk_left_start:function(){
        scene.main.foot_l.alpha = 1;
        scene.main.addChild(scene.main.foot_l);
    },
        //行走的视觉提示
    walk_right_end:function(){
        scene.main.foot_r.alpha = 0.6;
        scene.main.addChild(scene.main.foot_r);
    },
    walk_left_end:function(){
        scene.main.foot_l.alpha = 0.6;
        scene.main.addChild(scene.main.foot_l);
    }
}




