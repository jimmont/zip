# zip

small Deno http, websocket service that generates noise for clients
to experiment with simple visualization
and use the new platforms (LitElement, Deno, Web APIs)

add `config.js` (ex below) for configuration details

more info:
https://deno.land/
https://lit-element.polymer-project.org/


still figuring out an optimal way to pull in 3rd party dependencies without having to think about it or rely on unrelated tools



```javascript
// config.js
export const config = {
	port: 8000
	,static: '/www'
	,cspdomains: [
		'http://localhost/*'
	]
	,cors: {
	// http:// localhost [::] 127.0.0.1 https://any.github.io with optional port like :8765
		origin: /^(?:http:\/\/(?:localhost|127\.0\.0\.1|\[::\])(?::\d{2,5})?|https:\/\/[a-zA-Z0-9]+\.github\.io)$/
		,exposedHeaders: 'X-appmsg'
		,credentials: true
	}
};
```

https://jimmont.github.io/
