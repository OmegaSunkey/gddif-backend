
export interface Env {
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		let url = new URL(request.url);
		let params = url.searchParams;
		
		if(isNaN(Number(params.get("id")))) return new Response("Please do not insert a string !", {status: 400})
		
		const CORSHeaders = new Headers({
			"Content-Type": "application/json",
			"Access-Control-Allow-Headers": "*",
			"Access-Control-Allow-Methods": "GET",
			"Access-Control-Allow-Origin": "*"
		})
		switch(url.pathname) {
		  case "/browser":
			let lvlDiff2 = await env.DB.batch([
				env.DB.prepare("SELECT * FROM DiffTable WHERE id = ?").bind(params.get("id")),
				env.DB.prepare("SELECT * FROM DiffSub WHERE id = ?").bind(params.get("id"))
			]);
			let lvlData = await env.DB.prepare("SELECT * FROM LvlData WHERE id = ?").bind(params.get("id")).run()
			if(lvlData.results.length == 0) {
				let preReq = new Request(`https://some.site/?apiurl=${encodeURIComponent("https://www.boomlings.com/database/getGJLevels21.php")}`, {
					method: 'POST',
					headers: {
							"User-Agent": " ",
							"Content-Type": "application/x-www-form-urlencoded"
						},
					body: `str=${params.get("id")}&type=0&secret=Wmfd2893gb7`
				})
				let sent = await this.handleRequest(preReq)
				let parsed = await sent.text()
				let lvlJSON = this.parseLevel(parsed)
				lvlJSON.diff = lvlDiff2
				let nameSubmit = await env.DB.prepare("INSERT INTO LvlData (id, name, difficulty, demon, auto, creator) VALUES (?1, ?2, ?3, ?4, ?5, ?6)").bind(params.get("id"), lvlJSON.name, lvlJSON.difficulty, lvlJSON.demon, lvlJSON.auto, lvlJSON.creator).run()
				return new Response(JSON.stringify(lvlJSON), {
					headers: CORSHeaders
				})
			} else {
			return new Response(JSON.stringify({
				name: lvlData.results[0].name,
				difficulty: lvlData.results[0].difficulty,
				demon: lvlData.results[0].demon,
				auto: lvlData.results[0].auto,
				creator: lvlData.results[0].creator,
				diff: lvlDiff2
			}), {
				headers: CORSHeaders
			})
			}
			break;
		  case "/getDiff":
		    let lvlDiff = await env.DB.batch([
		        env.DB.prepare("SELECT * FROM DiffTable WHERE id = ?").bind(params.get("id")),
		        env.DB.prepare("SELECT * FROM DiffSub WHERE id = ?").bind(params.get("id")),
		      ]);
		    return Response.json(lvlDiff);
		    break;
		  case "/setDiff":
		    for (let i = 1; i < 11; i++) {
				if(isNaN(Number(params.get(`p${i}`)))) return new Response("do not try to insert strings.")
				if(params.get(`p${1}`) === null) return new Response("please put ALL the parameters specified: id p1 p2 p3 p4 p5 p6 p7 p8 p9 p10")
				if(Number(params.get(`p${i}`)) > 10 || Number(params.get(`p${i}`)) < 0) return new Response("you will not input values greaterr than 10 or less than 0 !!!!!!")
			}
		    let submission = await env.DB.prepare("INSERT INTO DiffSub (id, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)").bind(
		      params.get("id"), params.get("p1"), params.get("p2"), params.get("p3"), params.get("p4"), params.get("p5"), params.get("p6"), params.get("p7"), params.get("p8"), params.get("p9"), params.get("p10")
		      ).run()
		    return new Response(JSON.stringify(submission), {
				headers: CORSHeaders
			});
		    break;
		  case "/":
			return Response.json("Nothing to see in base...");
		}
	},
	async handleRequest(request) {
		const url = new URL(request.url);
		const apiurl = url.searchParams.get('apiurl');
		request = new Request(apiurl, request);
		request.headers.set('Origin', new URL(apiurl).origin);
		request.headers.set('User-Agent', " ");
		let response = await fetch(request);
		response = new Response(response.body, response);
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.append('Vary', 'Origin');
		return response;
	},
	parseLevel(lvlstr) {
		let parsedLevelString = lvlstr.split(":");
		let objLevel = {};
		const mapLevelString = (str) => {
			switch(str) {
				case "2":
					return "name"
				case "9":
					return "difficulty"
				case "17":
					return "demon"
				case "25":
					return "auto"
				default:
					return null
			}
		}
	
		for (let i = 0; i < parsedLevelString.length; i += 2) {
			if(mapLevelString(parsedLevelString[i]) != null) objLevel[mapLevelString(parsedLevelString[i])] = parsedLevelString[i + 1];
		}
	
		objLevel.creator = lvlstr.split("#")[1].split(":")[1] || "Player";
	
		return objLevel;
	}
} satisfies ExportedHandler <Env>;
