/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export interface Env {
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		let url = new URL(request.url);
		let params = url.searchParams;
		switch(url.pathname) {
		  case "/testGD":
		    let res = await fetch("https://boomlings.com");
		    return Response.json(res.status);
		    break;
		  case "/getDiff":
		    let lvlDiff = await env.DB.batch([
		        env.DB.prepare("SELECT * FROM DiffTable WHERE id = ?").bind(params.get("id")),
		        env.DB.prepare("SELECT * FROM DiffSub WHERE id = ?").bind(params.get("id")),
		      ]);
		    return Response.json(lvlDiff);
		    break;
		  case "/setDiff":
		    //id, p1...p10; thats the order
		    let submission = await env.DB.prepare("INSERT INTO DiffSub (id, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)").bind(
		      params.get("id"), params.get("p1"), params.get("p2"), params.get("p3"), params.get("p4"), params.get("p5"), params.get("p6"), params.get("p7"), params.get("p8"), params.get("p9"), params.get("p10")
		      ).run()
		    return Response.json(submission);
		    break;
		  /*default:
		    return new Response("Welcome to geometry dash")*/
		}
		//return new Response(`${params.get("id")}`);
	},
} satisfies ExportedHandler <Env>;
