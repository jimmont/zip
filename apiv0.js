/*
to test in browser console or script:
fetch('http://localhost:8000/api/v0/config').then(res=>res.text()).then(console.log)

eventually expand this to handle more specific operations

TODO remove model-name "config" if and where possible for future iterations, isolate stuff to make it more turnkey/general

TODO
API is a thing that does 'create read update delete' for a given model that it is aware of and maps directly to the URL
make class that generates API based on this...
methods: route (setup), crud ops, 
*/

class API{
	constructor(version=-1, models={}){
		this.version = version;
		this.models = models || {};

		this.http = this.http.bind(this);
	}
	create(req){
	// return copy of original full thing to show it working
		return JSON.parse(JSON.stringify(req));
	}
	read(req){
		return this.create(req);
	}
	update(req){
		return this.create(req);
	}
	delete(req){
		return this.create(req);
	}
	route(router, cors = async ()=>{} ){
		const url = `/api/v${this.version}/:model`;
		// HTTP/CRUD = POST/CREATE,GET/READ,PUT/UPDATE-replace PATCH/UPDATE-modify,DELETE
		// https://www.restapitutorial.com/lessons/httpmethods.html

		router
			.options(url, cors)
			.post(url, cors, this.http)
			.get(url, cors, this.http)
			.put(url, cors, this.http)
			.patch(url, cors, this.http)
			.delete(url, cors, this.http)
			;
	}
	// isolate protocol (HTTP) from business logic and handle errors to fit
	// TODO handle route params, query params, request body
	async http(context){
		let res;
		const op = {
			type: context.params.model
			,model: this.models[ context.params.model ]
			,params: context.request.url.searchParams
		};

		try{
			if(!op.model){
				context.response.status = 404;
				throw new Error(`unknown model ${ op.type }`);
			};

			switch(context.request.method){
			case 'POST':
				op.params = await context.request.body().value;
				res = await this.create(op);
			break;
			case 'GET':
				// expose in JSON
				op.params = Array.from(op.params.entries());
				res = await this.read(op);
			break;
			case 'PUT':
				op.params = await context.request.body().value;
				res = await this.update(op);
			break;
			case 'DELETE':
				res = await this.delete(op);
			break;
			}

		}catch(err){

			if((context.response.status || 0) < 400) context.response.status = 500;

			res = err.message;

		}finally{

			context.response.body = {api: 0, data: res};

		};

	}
}

const version = 0;
const models = {
	config: {name: 'config', value: 1}
};

const APIv0 = new API(version, models);

export { API, APIv0 };
