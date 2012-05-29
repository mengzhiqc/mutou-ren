
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  ,	io = require('socket.io') ;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/../static'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/test/', function(req,res){
	res.render('test', { title: 'Express' });
});
app.get('/hello/', function(req,res){
	res.send("this is my first node app");
});

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

var io = io.listen(app);
var sockets = io.sockets;
var gameParams = {};
sockets.on('connection',function(socket){
	console.info("client have connect to server");
	socket.on('ready',function(data){
		console.info("recieve ",data,"from client");
		//����Ĭ�ϲ���
		gameParams = {
				config:{stepLength:2,watchTimeLimit:4,gameTimeLimit:60},
				gameStatus:{winner:0,currentTime:0,status:3,lastWalkId:0,lastWalkRoleId:0,turnLock:false},
				role:{
				      1:{name:'role1',source:'01'},
				      2:{name:'role2',source:'02'},
				      3:{name:'role3',source:'03'},
				      4:{name:'role4',source:'04'}
					},
				collection:{
					watcher:{
						id:0,
						watchTime:0,
						turnWilling:false,
						turning:false
					},
					wooder:[],
				}
		};
		console.info('have init gameParams ',gameParams);
		socket.emit('initGames',gameParams);
		
	});
	
	//�����Ϸ����
	socket.on('addPerson',function(data){
		if(data == 1){
			console.info("recieve add Person Request and Deal With It");
			if(!gameParams.collection){
				socket.emit('addPerson',"NoInit");
				return;
			}
			var wooderCollection = gameParams.collection.wooder;
			
			if(wooderCollection.length > 2){
				socket.emit('addPerson',"-1");
				return;
			}
			var rolePool = [];  //rolePool
			if(gameParams.collection.watcher.id==0){
				gameParams.collection.watcher.id = -1;
				var newRoleWatcher = gameParams.collection.watcher;
				socket.broadcast.emit('addPerson',newRoleWatcher);
				
				socket.emit('success',newRoleWatcher);
				console.info("add watcher success, watch property:",newRoleWatcher);
			}else{
				//��ʾ��Ϸ��ʼ
				gameParams.gameStatus.status = 1;
				var currentIndex = wooderCollection.length +1;
				var newRoleWood = {roleId : currentIndex, position:0, lastPosition:0, active:true};
				gameParams.collection.wooder.push(newRoleWood);
				console.info("now wooder ", gameParams.collection.wooder);
				//��ͻ��˹㲥�½�ɫ
				socket.broadcast.emit('addPerson',newRoleWood);
				socket.emit('success',newRoleWood);
			}
				return;
			
		}
	});
	
	//������·�¼�
	socket.on("walk",function(data){
		console.log("walk object:",gameParams);
		//��ȡroleId
		var roleId = data.roleId;
		var stepLength = gameParams.config.stepLength;
		var rolePositionContainer = [];
		if(!gameParams.collection.wooder[roleId-1].active){
			return ;
		}
		//��ȡ���walk���¼�
		gameParams.gameStatus.lastWalkId += 1;
		gameParams.gameStatus.lastWalkRoleId = roleId;
		if(gameParams.gameStatus.turnLock){ //���תͷ�����¼�Ϊtrueʱ����walk���������������
			gameParams.collection.wooder[roleId-1].active = false;
			socket.emit("outStage",{roleId:roleId});
			socket.broadcast.emit("outStage",{roleId:roleId});
			return ;
		}
		
		gameParams.collection.wooder[roleId-1].position += stepLength;
		if(gameParams.collection.wooder[roleId-1].position >= 100){
			gameParams.gameStatus.winner = roleId;
			gameParams.gameStatus.status = 2;
			socket.broadcast.emit('win',roleId);
			socket.emit('win',roleId);
			return;
		}
		console.log("calculate position: ",	gameParams.collection.wooder[roleId-1].position );
		var wooderList  =  gameParams.collection.wooder;
		for(var i=0;i<wooderList.length;i++){
			rolePositionContainer[i] = gameParams.collection.wooder[i].position;
		}
		socket.emit('returnPositionInfo',rolePositionContainer);
		socket.broadcast.emit('returnPositionInfo',rolePositionContainer);
		console.log("position info:"+rolePositionContainer);
		return ;
	})

	//׼��ת���¼�
	socket.on('willingBegin',function(data){
		if(data == 1){
			gameParams.collection.watcher.turnWilling = true;
			gameParams.collection.watcher,turnWillingTimeStamp = new Date().getTime();
			socket.emit("twistBody",1);
			socket.broadcast.emit("twistBody",1);
			return;
		}
	});
	
	socket.on("confirmTurn",function(data){
		if(data == 1){
			gameParams.gameStatus.turnLock = true;
			for(var i= 0; i< gameParams.collection.wooder.length; i++){
				if(gameParams.collection.wooder[i].active){
					gameParams.collection.wooder[i].lastPosition = gameParams.collection.wooder[i].position;
				}
				
			}
			socket.emit("confirmTurn","1");
			socket.broadcast.emit("confirmTurn","1");
			
			setTimeout(function(){
				gameParams.gameStatus.turnLock = false;
				socket.broadcast.emit("twistBackBody","1");
				socket.emit("twistBackBody","1");
			},500);
			
		}
	});
	
	//console.info(gameParams);
	socket.on('disconnect',function(){

	});
	

});


