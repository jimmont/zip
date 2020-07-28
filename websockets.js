import { isWebSocketCloseEvent, acceptable } from "https://deno.land/std@0.61.0/ws/mod.ts";

const users = new Set();
function broadcastEach(user){
	user.send(this);
}
function broadcast(msg){
	//console.log(`-broadcast->`,typeof msg, msg)
	users.forEach(broadcastEach, msg);
}

async function pipes(socket){
	try{
		users.add(socket);
		broadcast(`hello! ${ socket.conn.rid }`);
		for await (const evt of socket){
			if(isWebSocketCloseEvent(evt)){
				users.delete(socket);
				broadcast(`bye! ${ socket.conn.rid }`);
			}else{
				broadcast(evt);
			}
		}
	}catch(err){
		console.error(err);
	}
}

export const websockets = async (context, next) => {
	if( !acceptable(context.request.serverRequest) ){
		context.response.status = 400;
		throw new Error(`not upgradable to WebSocket`);
	}
	const socket = await context.upgrade();
	pipes(socket);
}

const noise = {
	delay: 10
	,broadcast: function(){
		var noise = this.data();
		broadcast(noise);
		this.timer = setTimeout(this.broadcast, this.delay);
		return this;
	}
	,message: function(connection){
		connection.sendBytes(this);
	}
	// min and max are inclusive; use integers
	,random: function(min=0, max=100){
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	,data: function(){
		const buffer = new ArrayBuffer(412);
		const uint = new Uint8Array(buffer);
		var l = uint.byteLength;
		while(l--){
			uint[l] = this.random();
		}
		return uint;
	}
	,start(){
		this.broadcast = this.broadcast.bind(this);
		this.start = ()=>{};
		this.broadcast();
		return this;
	}
};
noise.start();
window.addEventListener('unhandledrejection', (ev)=>{
	console.warn(ev.promise);
	console.error(ev.reason);
});

