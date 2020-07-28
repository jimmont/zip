/*
Deno (v1.2) variation of http, socket interfaces for UI and device middleware

to run:
$ deno run --alow-net --allow-read ./http.js

to debug (use --inspect-brk to break on start):
$ deno run --inspect --alow-net --allow-read ./http.js
open chrome://inspect/#devices and open the target

TODO review error handling, closing

console.log() console.warn() and console.error() are directed to stdout and stderr

config.js example
export const config = {
	port: 8000
	,static: '/www'
	,cspdomains: ['http://localhost/*', ...]
	,cors: {
	// http:// localhost [::] 127.0.0.1 https://any.github.io with optional port like :8765
		origin: /^(?:http:\/\/(?:localhost|127\.0\.0\.1|\[::\])(?::\d{2,5})?|https:\/\/[a-zA-Z0-9]+\.github\.io)$/
		,exposedHeaders: 'X-appmsg'
		,credentials: true
	}
};

*/

import { config as httpConfig } from "./config.js";
import { Application, Router, HttpError, send, Status } from "https://deno.land/x/oak@v6.0.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { websockets } from "./websockets.js";
// CRUD for objects
import { APIv0 } from "./apiv0.js"
// TODO JWT from OAUTH provider https://deno.land/x/djwt

httpConfig.wwwroot = Deno.cwd() + httpConfig.static;

httpConfig.userAgent = `Deno/${Deno.version.deno} V8/${Deno.version.v8} TS/${Deno.version.typescript} ${Deno.build.target}`;

const app = new Application({state:httpConfig});

const router = new Router();

const cors = oakCors(httpConfig.cors);
APIv0.route(router, cors);

router.get('/socket', websockets);

const mimetypes = {
	css: 'text/css; charset=utf-8'
	,ico: 'image/vnd.microsoft.icon'
	,jpg: 'image/jpeg'
	,js: 'text/javascript; charset=utf-8'
	,json: 'application/json; charset=utf-8'
	,pdf: 'application/pdf; charset=utf-8'
	,txt: 'text/plain; charset=utf-8'
	,html: 'text/html; charset=utf-8'
	// application/csp-report as JSON
}

// general error handling including unhandled middleware errors (500)
app.use(async ({response, request}, next) =>{
	try{
		await next();
	}catch(err){
		const status = err instanceof HttpError ? err.status : 500;
		// respect error status codes set by other middleware
		if((response.status || 0) < 400){
			response.status = status;
		};
		log(status, request.method, request.url.href, request.user, request.headers.get('user-agent'), request.ip);
		// adjust response to fit requested mimetype
		let ext = request.url.pathname.split('?')[0].split('.').pop().toLowerCase();
		
		let type = mimetypes[ ext ] || mimetypes[ ( ext = 'html' ) ];
		response.type = type;

		// short caches on errors
		response.headers.set('Cache-Control','private, max-age=11, s-maxage=11');

		const msg = (err.message || '').slice(0, 3000);

		if(err.expose){
			response.headers.set('X-appmsg', msg);
		};

		// send an appropriate response
		switch(ext){
		case 'html':
		response.body = `<!doctype html>
<html><body>
<p>${status} ${ Status[status] || 'Internal Server Error' }</p>
</body></html>`;
		break;
		default:
		response.body = '';
		}
	}
});

function log(status='000', VERB='GUESS', what='', who='?', client='~', where='...', other='-'){
	console.log(`${ (new Date).toISOString() } ${ status } "${ VERB } ${ what }" ${ who } "${ client }" ${ where } ${ other }`);
}

// Logger
app.use(async (context, next) => {
	await next();
	const request = context.request;
	const time = context.response.headers.get('X-Response-Time');
	log(context.response.status, request.method, request.url, request.user, request.headers.get('user-agent'), request.ip, time);
});

app.use(async (context, next) => {
	const start = Date.now();
	await next();
	const msg = Date.now() - start;
	context.response.headers.set('X-Response-Time', `${msg}ms`);

/* TODO CSP

REVIEW
https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
https://developers.google.com/web/fundamentals/security/csp/

const domains = context.app.state.domains;
// also use server.hostname as per the listen handler below

context.response.headers.set('Content-Security-Policy', `default-src 'self' 'unsafe-eval' blob: data: file: ${ domains.join(' ') }; style-src 'self' 'unsafe-inline' ; img-src 'self' data: blob: ${ domains.join(' ') } ; script-src 'self'; connect-src ; object-src 'self'; `)

*/
})


app.use(router.routes());
app.use(router.allowedMethods());

// static content
app.use(async context => {
	await send(context, context.request.url.pathname, {
		root: `${context.app.state.wwwroot}`,
		index: 'index.html'
	});
});

app.addEventListener('error', (ev)=>{
	console.error('TODO',ev.error);
debugger;
//		log('000', 'ERROR', `${ ev.error }`, undefined, httpConfig.userAgent);
});
app.addEventListener('listen', (server)=>{
	log('000', 'START', `${ server.secure ? 'https':'http' }://${ server.hostname }:${ server.port }`, undefined, httpConfig.userAgent);
});

const whenClosed = app.listen(`:${httpConfig.port}`);

await whenClosed;
console.log('CLOSE');
//	log('000', 'CLOSE', `${ server.secure ? 'https':'http' }://${ server.hostname }:${ server.port }`, undefined, httpConfig.userAgent);
