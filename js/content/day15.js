/* Day 15: ASP.NET Core Fundamentals */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[15] = {
  html: `
<p>ASP.NET Core is the web stack of modern .NET: one framework for APIs, MVC sites, Blazor apps, and real-time services. Today: hosts, Kestrel, middleware, and minimal APIs.</p>

<h2>The anatomy of a web app</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 250" width="820" height="250" role="img" aria-label="ASP.NET Core request pipeline">
  <defs><marker id="d15a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="30" width="140" height="50" rx="8" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.4"/><text x="90" y="52" text-anchor="middle" class="dg-text">Client</text><text x="90" y="68" text-anchor="middle" class="dg-sub">browser / app</text>
  <rect x="210" y="30" width="140" height="50" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="280" y="52" text-anchor="middle" class="dg-text">Kestrel</text><text x="280" y="68" text-anchor="middle" class="dg-sub">HTTP/1-2-3 server</text>
  <text x="410" y="20" text-anchor="middle" class="dg-text">Middleware pipeline (ordered!)</text>
  <rect x="215" y="110" width="130" height="34" rx="6" fill="#efedfd" stroke="#6c5ce7"/><text x="280" y="132" text-anchor="middle" class="dg-sub">Exception handler</text>
  <rect x="355" y="110" width="130" height="34" rx="6" fill="#efedfd" stroke="#6c5ce7"/><text x="420" y="132" text-anchor="middle" class="dg-sub">HTTPS / HSTS</text>
  <rect x="495" y="110" width="130" height="34" rx="6" fill="#efedfd" stroke="#6c5ce7"/><text x="560" y="132" text-anchor="middle" class="dg-sub">Routing</text>
  <rect x="635" y="110" width="150" height="34" rx="6" fill="#fef3e2" stroke="#d97706"/><text x="710" y="132" text-anchor="middle" class="dg-sub">Endpoints (minimal/MVC)</text>
  <line x1="160" y1="55" x2="208" y2="55" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d15a)"/>
  <path d="M 280 80 L 280 108" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d15a)" fill="none"/>
  <text x="90" y="200" text-anchor="middle" class="dg-sub">Each middleware can act on the request,</text>
  <text x="90" y="218" text-anchor="middle" class="dg-sub">call next, and act on the response.</text>
  <text x="560" y="200" text-anchor="middle" class="dg-sub">Short-circuiting middleware (auth, static files)</text>
  <text x="560" y="218" text-anchor="middle" class="dg-sub">can stop the pipeline entirely.</text>
</svg>
</div>

<h2>The minimal API in one file</h2>
<div class="codeblock"><div class="codeblock-header">Program.cs &mdash; a complete web API</div><pre><code>var builder = WebApplication.CreateBuilder(args);

// Services &mdash; DI from Day 14:
builder.Services.AddSingleton&lt;IProductRepository, InMemoryProductRepository&gt;();
builder.Services.AddOpenApi();            // OpenAPI/Swagger for .NET 8+

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();                     // /openapi/v1.json

// Middleware (order matters!):
app.UseHttpsRedirection();
app.UseAuthorization();

// Endpoints &mdash; lambdas become HTTP handlers:
app.MapGet("/products", async (IProductRepository repo) =&gt;
    Results.Ok(await repo.GetAllAsync()));

app.MapGet("/products/{id:int}", async (int id, IProductRepository repo) =&gt;
    await repo.GetAsync(id) is { } product
        ? Results.Ok(product)
        : Results.NotFound());

app.MapPost("/products", async (Product p, IProductRepository repo) =&gt;
{
    var created = await repo.AddAsync(p);
    return Results.Created($"/products/{created.Id}", created);
});

app.Run();</code></pre></div>
<div class="callout note"><div class="co-title">Parameter injection in endpoints</div><p>Route values (<code>{id:int}</code>), services from DI (<code>IProductRepository</code>), and the body (<code>Product p</code>) are bound automatically by type. If it is registered in DI, you can ask for it in the signature.</p></div>

<h2>Host, environments, and configuration</h2>
<div class="codeblock"><div class="codeblock-header">Environments &amp; config</div><pre><code>// ASPNETCORE_ENVIRONMENT=Development | Production | Staging
// Configuration order (last wins): appsettings.json &rarr; appsettings.{Env}.json
//   &rarr; user secrets (dev) &rarr; env vars &rarr; command line

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();     // detailed errors, dev only
}
else
{
    app.UseHsts();                       // strict transport security
}

// User secrets for local development (never commit real keys!):
//   dotnet user-secrets init
//   dotnet user-secrets set "ApiKey" "dev-only-value"</code></pre></div>

<h2>Kestrel and the web roots</h2>
<p>Kestrel is the built-in, cross-platform server &mdash; one of the fastest available. Behind a reverse proxy (IIS, Nginx, YARP) it binds to localhost; exposed directly it terminates TLS itself. Either way your app is identical; deployment differs.</p>

<h2>Middleware: the pipeline you shape</h2>
<p>Middleware are functions in a chain; each decides to (a) do work before passing along, (b) short-circuit, or (c) do work on the way <em>back</em>. <code>Use</code> = continue chain; <code>Run</code> = terminal; <code>Map</code> = branch for a path. Order is behavior &mdash; the canonical order is not a suggestion.</p>
<div class="diagram-wrap">
<svg viewBox="0 0 860 200" width="860" height="200" role="img" aria-label="Middleware onion: request in, response out">
  <defs><marker id="d15y" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="60" width="120" height="80" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/>
  <text x="80" y="95" text-anchor="middle" class="dg-text">Exception</text><text x="80" y="113" text-anchor="middle" class="dg-text">handler</text>
  <rect x="160" y="70" width="120" height="60" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="220" y="97" text-anchor="middle" class="dg-text">HTTPS</text><text x="220" y="115" text-anchor="middle" class="dg-text">redirect</text>
  <rect x="300" y="80" width="120" height="40" rx="10" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/>
  <text x="360" y="105" text-anchor="middle" class="dg-text">Routing</text>
  <rect x="440" y="70" width="120" height="60" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="500" y="97" text-anchor="middle" class="dg-text">CORS</text><text x="500" y="115" text-anchor="middle" class="dg-text">(preflight)</text>
  <rect x="580" y="60" width="120" height="80" rx="10" fill="#ece8fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="640" y="95" text-anchor="middle" class="dg-text">AuthN &rarr;</text><text x="640" y="113" text-anchor="middle" class="dg-text">AuthZ</text>
  <rect x="720" y="75" width="120" height="50" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/>
  <text x="780" y="105" text-anchor="middle" class="dg-text">Endpoint</text>
  <path d="M 80 145 Q 80 185 400 185 Q 780 185 780 130" fill="none" stroke="#0e9f6e" stroke-width="1.6" stroke-dasharray="5,4" marker-end="url(#d15y)"/>
  <text x="400" y="170" text-anchor="middle" class="dg-sub">response flows back through the same chain &mdash; logging/status middleware see it on the way out</text>
</svg>
</div>
<div class="codeblock"><div class="codeblock-header">Program.cs &mdash; canonical order and why</div><pre><code>var app = builder.Build();

app.UseExceptionHandler("/error");       // 1. catch everything downstream FIRST
if (!app.Environment.IsDevelopment())
    app.UseHsts();                       // 2. tell browsers: https-only from now on
app.UseHttpsRedirection();               // 3. 307 to https for http requests
app.UseStaticFiles();                    // 4. serve wwwroot &mdash; short-circuits most requests
app.UseRouting();                        // 5. decide WHICH endpoint (sets endpoint metadata)
app.UseCors();                           // 6. before auth &mdash; preflights must succeed pre-auth
app.UseAuthentication();                 // 7. WHO &mdash; populates ClaimsPrincipal
app.UseAuthorization();                  // 8. MAY &mdash; evaluates policies
app.UseRateLimiter();                    // 9. throttling after auth (per-user, not per-IP)
app.MapControllers();                    // 10. endpoints run LAST
app.Run();</code></pre></div>

<h3>Writing your own middleware (all three styles)</h3>
<div class="codeblock"><div class="codeblock-header">Middleware.cs &mdash; lambda, convention class, IMiddleware</div><pre><code>// 1. Lambda &mdash; quick and local:
app.Use(async (context, next) =&gt;
{
    var sw = Stopwatch.StartNew();
    await next(context);                              // &larr; call the REST of the pipeline
    Console.WriteLine($"{context.Request.Method} {context.Request.Path} =&gt; " +
                      $"{context.Response.StatusCode} in {sw.ElapsedMilliseconds} ms");
});

// 2. Convention class &mdash; reusable, constructor-injected singletons:
public class RequestTimingMiddleware(RequestDelegate next, ILogger&lt;RequestTimingMiddleware&gt; log)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        try { await next(context); }
        finally { log.LogInformation("{Method} {Path} took {Ms} ms",
                    context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds); }
    }
}
// app.UseMiddleware&lt;RequestTimingMiddleware&gt;();

// 3. IMiddleware &mdash; resolved from DI per request (scoped deps work naturally):
public class TenantMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext ctx, RequestDelegate next)
    {
        if (!ctx.Request.Headers.TryGetValue("X-Tenant", out var tenant))
        {
            ctx.Response.StatusCode = 400;             // short-circuit
            await ctx.Response.WriteAsJsonAsync(new { error = "X-Tenant header required" });
            return;
        }
        ctx.Items["Tenant"] = tenant.ToString();       // share data downstream
        await next(ctx);
    }
}
// builder.Services.AddScoped&lt;TenantMiddleware&gt;();  +  app.UseMiddleware&lt;TenantMiddleware&gt;();</code></pre></div>
<div class="callout tip"><div class="co-title">HttpContext 101 &mdash; the object everything revolves around</div><p><code>context.Request</code> (method, path, headers, query, body streams), <code>context.Response</code> (status, headers, body), <code>context.User</code> (claims), <code>context.Items</code> (per-request scratchpad), <code>context.RequestAborted</code> (CancellationToken firing when the client disconnects &mdash; pass it to your queries!). Per-request, never thread-safe; in minimal APIs you rarely touch it directly because parameters bind from it.</p></div>

<h2>Routing and endpoint groups</h2>
<p>Routing matches <code>URL + method &rarr; endpoint</code> and attaches <em>metadata</em> (auth policies, CORS, cache profiles) that other middleware read. Route constraints validate before your code runs; groups organize related endpoints the way controllers used to.</p>
<div class="codeblock"><div class="codeblock-header">Route constraints + MapGroup</div><pre><code>var products = app.MapGroup("/products")            // group = shared prefix + shared policy
    .WithTags("Products")
    .RequireAuthorization();

products.MapGet("/", GetAll);                       // GET /products
products.MapGet("/{id:int:min(1)}", GetById);       // rejects id&lt;1 before your code runs
products.MapGet("/{id}/reviews/{page:int:min(1)}", GetReviews);
products.MapPost("/", Create).RequireAuthorization("Admin");   // tighten per endpoint
products.MapPut("/{id:int}", Replace);
products.MapDelete("/{id:int}", Delete).RequireAuthorization("Admin");

// Constraint gallery: :int :bool :datetime :guid :alpha :min(1) :max(100)
//   :range(1,100) :minlength(2) :maxlength(50) :regex(^[a-z]{{2,10}}$)</code></pre></div>

<h2>TypedResults: return values that document themselves</h2>
<div class="callout note"><div class="co-title">Results vs TypedResults</div><p><code>Results.Ok(x)</code> returns <code>IResult</code> &mdash; flexible but invisible to OpenAPI. <code>TypedResults.Ok&lt;Product&gt;(x)</code> returns a concrete type, so the generated OpenAPI document knows the response shape <em>and</em> your unit tests can assert on it directly. Prefer <code>TypedResults</code> in every serious API (Day 16 leans on this).</p></div>

<h2>Error handling that clients can code against</h2>
<div class="codeblock"><div class="codeblock-header">ProblemDetails &mdash; RFC 7807 / RFC 9457</div><pre><code>builder.Services.AddProblemDetails(o =&gt; o.CustomizeMapping = ctx =&gt;
{
    ctx.ProblemDetails.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier;
});

var app = builder.Build();
app.UseExceptionHandler();      // converts ANY unhandled exception &rarr; 500 ProblemDetails
// (in dev, UseDeveloperExceptionPage gives the full stack instead)

// Global handler for a whole exception class &mdash; .NET 8 IExceptionHandler:
public class ValidationExceptionHandler(IProblemDetailsService pds) : IExceptionHandler
{
    public async ValueTask&lt;bool&gt; TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        if (ex is not DomainValidationException vex) return false;   // not mine &rarr; next handler
        ctx.Response.StatusCode = 400;
        return await pds.TryWriteAsync(new()
        {
            HttpContext = ctx,
            ProblemDetails = new() { Title = "Validation failed", Detail = vex.Message,
                                     Status = 400 }
        });
    }
}
// builder.Services.AddExceptionHandler&lt;ValidationExceptionHandler&gt;();
// builder.Services.AddProblemDetails();  +  app.UseExceptionHandler();</code></pre></div>

<h2>Environments and configuration, the production view</h2>
<div class="codeblock"><div class="codeblock-header">Environment-aware wiring</div><pre><code>if (app.Environment.IsDevelopment())          // ASPNETCORE_ENVIRONMENT=Development
{
    app.MapOpenApi();                          // expose the contract
    app.UseDeveloperExceptionPage();           // verbose errors
}
else
{
    app.UseExceptionHandler();                 // safe generic errors
    app.UseHsts();                             // max-age 1 year, includeSubDomains
}

// Secrets in dev: stored OUTSIDE the repo, per-user on disk
//   dotnet user-secrets init
//   dotnet user-secrets set "Jwt:Key" "dev-only-64-chars..."
// In prod: environment variables / Key Vault / AWS Secrets Manager &mdash; never appsettings.json.</code></pre></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (35 min)</div>
<p>Build a minimal API for the Day 7 task tracker: <code>GET /tasks</code>, <code>GET /tasks/{id:int}</code>, <code>POST /tasks</code>, <code>PUT /tasks/{id}/complete</code>, using a <code>MapGroup</code> with a shared tag. Return proper codes (201 + Location, 404, 400 ProblemDetails) with <code>TypedResults</code>. Then: (1) write a timing middleware class and confirm order matters by moving it before/after routing; (2) add a <code>TenantMiddleware</code> that 400s without a header; (3) provoke an exception and verify the ProblemDetails body carries your traceId; (4) break the middleware order (auth after routing) and observe the failure so you never forget it.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Five layers: host &rarr; server &rarr; middleware &rarr; routing &rarr; endpoint; each owns specific failure modes.</li>
  <li>Middleware order <em>is</em> behavior; exception handler first, endpoints last.</li>
  <li>Kestrel is the fast core; behind a proxy, forwarded headers are mandatory.</li>
  <li><code>MapGroup</code> + constraints + <code>TypedResults</code> + ProblemDetails = APIs that self-document.</li>
  <li>Secrets: user-secrets in dev, Key Vault/env vars in prod, never in appsettings.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Add a <code>UseMiddleware</code> class that returns 429 after 5 requests per minute (store counts in a <code>ConcurrentDictionary</code>).</li><li>Write an <code>IExceptionHandler</code> for <code>DivideByZeroException</code> returning 400 (absurd, but proves the pipeline).</li><li>Wire <code>app.MapHealthChecks("/health")</code> and hit it from a loop &mdash; watch concurrency behavior.</li></ul>
`,
  quiz: [
    {
      "q": "The correct middleware order is…",
      "a": [
        "Auth → exceptions → routing",
        "Exception handler → HTTPS → routing → auth → endpoints",
        "Routing first always",
        "Endpoints before middleware"
      ],
      "correct": 1,
      "expl": "ExceptionHandler first (catches all), endpoints last."
    },
    {
      "q": "UseCors must come before UseAuthentication because…",
      "a": [
        "Performance",
        "Preflight OPTIONS requests carry no auth token",
        "Cookies need it",
        "It is alphabetical"
      ],
      "correct": 1,
      "expl": "Preflights must succeed pre-auth or every cross-origin call fails."
    },
    {
      "q": "TypedResults vs Results — TypedResults…",
      "a": [
        "Are shorter",
        "Preserve response types for OpenAPI + tests",
        "Are deprecated",
        "Skip validation"
      ],
      "correct": 1,
      "expl": "Concrete return types document themselves in the contract."
    },
    {
      "q": "Behind Nginx, your app sees the proxy IP. Fix:",
      "a": [
        "UseHttpsRedirection",
        "UseForwardedHeaders with KnownProxies",
        "UseHsts",
        "Disable logging"
      ],
      "correct": 1,
      "expl": "Forwarded headers restore the real client IP/scheme — restricted to trusted proxies."
    }
  ]

};