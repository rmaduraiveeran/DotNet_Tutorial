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

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (35 min)</div>
<p>Build a minimal API for the Day 7 task tracker: <code>GET /tasks</code>, <code>GET /tasks/{id}</code>, <code>POST /tasks</code>, <code>PUT /tasks/{id}/complete</code>. Reuse <code>TaskStore</code> from DI as a singleton. Return proper status codes (201 with Location header, 404, 400 with ProblemDetails). Add OpenAPI and try it from the Swagger UI.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Host &rarr; Kestrel &rarr; middleware pipeline &rarr; endpoints.</li>
  <li>Minimal APIs remove ceremony; MVC adds structure for large teams.</li>
  <li>Middleware order is behavior: exceptions &rarr; HTTPS &rarr; routing &rarr; auth.</li>
  <li>Configuration and environments are first-class &mdash; secrets never in code.</li>
</ul>
`
};
