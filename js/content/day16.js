/* Day 16: Web APIs & REST Design */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[16] = {
  html: `
<p>Yesterday you made endpoints work. Today you make them <em>good</em>: resource design, status codes, validation, and contracts clients can trust.</p>

<h2>REST in one diagram</h2>
<p>REST models your domain as <strong>resources</strong> addressed by URLs, manipulated through HTTP methods, with status codes as the outcome contract. The URL names a <em>noun</em>; the method is the <em>verb</em>; the status code is the <em>result</em>. If you find yourself wanting <code>POST /getOrders</code>, you are designing RPC, not REST &mdash; which is fine, but be honest about it and use gRPC or plain JSON-RPC instead.</p>
<div class="table-wrap"><table>
<thead><tr><th>Method</th><th>URL</th><th>Meaning</th><th>Success code</th><th>Idempotent?</th></tr></thead>
<tbody>
<tr><td>GET</td><td><code>/api/orders</code></td><td>list (paged!)</td><td>200</td><td>yes &mdash; safe, never mutate</td></tr>
<tr><td>GET</td><td><code>/api/orders/7</code></td><td>fetch one</td><td>200 / 404</td><td>yes</td></tr>
<tr><td>POST</td><td><code>/api/orders</code></td><td>create</td><td>201 + <code>Location</code></td><td>NO &mdash; retry duplicates it</td></tr>
<tr><td>PUT</td><td><code>/api/orders/7</code></td><td>replace entirely</td><td>200 / 404</td><td>yes</td></tr>
<tr><td>PATCH</td><td><code>/api/orders/7</code></td><td>partial update</td><td>200 / 404</td><td>usually</td></tr>
<tr><td>DELETE</td><td><code>/api/orders/7</code></td><td>remove</td><td>204 / 404</td><td>yes</td></tr>
</tbody></table></div>
<div class="callout note"><div class="co-title">Status codes are the contract</div><p><strong>2xx</strong> = success (200 ok, 201 created, 204 no content, 202 accepted-for-later). <strong>4xx</strong> = caller&rsquo;s fault (400 validation, 401 unauthenticated, 403 forbidden, 404 missing, 409 conflict, 422 semantic validation, 429 throttled). <strong>5xx</strong> = your fault (500, 503). Returning 200 with <code>{"error": ...}</code> in the body is how client trust dies &mdash; the status line is for machines, the body is for humans.</p></div>
<div class="callout tip"><div class="co-title">Design the URLs before the code</div><p>Collections are plural (<code>/orders</code>), nested resources show ownership (<code>/customers/5/orders</code>), filters/sort/paging are query params (<code>?status=open&amp;sort=-created&amp;page=2</code>), and sub-actions that don&rsquo;t fit CRUD are sub-resources: <code>POST /orders/7/cancel</code> or (purer) <code>POST /cancellations</code> with <code>{"orderId": 7}</code>. Write the URL table on a whiteboard first &mdash; it is cheaper than rewriting controllers.</p></div>

<h2>A well-designed controller</h2>
<p>Controllers are coordinators, not doers: bind input, call a service, shape the response. Business rules live in services; data access lives in repositories/DbContexts. This controller shows the full professional pattern &mdash; DI, async, typed results, OpenAPI metadata, structured logging.</p>
<div class="codeblock"><div class="codeblock-header">OrdersController.cs</div><pre><code>[ApiController]                              // auto model validation + binding source inference
[Route("api/[controller]")]                  // /api/orders  ([controller] = class name minus "Controller")
[Produces("application/json")]
public class OrdersController(
    IOrderRepository repo,
    ILogger&lt;OrdersController&gt; logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult&lt;OrderSummary&gt;), StatusCodes.Status200OK)]
    public async Task&lt;ActionResult&lt;PagedResult&lt;OrderSummary&gt;&gt;&gt; List(
        [FromQuery] int page = 1,                     // binding sources: [FromQuery] [FromRoute]
        [FromQuery] int pageSize = 20)                //   [FromBody] [FromHeader] [FromForm]
    {
        var result = await repo.GetPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Order), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task&lt;ActionResult&lt;Order&gt;&gt; Get(int id) =&gt;
        await repo.GetAsync(id) is { } order
            ? Ok(order)
            : NotFound();                             // empty 404 body &mdash; or ProblemDetails

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task&lt;ActionResult&lt;Order&gt;&gt; Create(CreateOrderRequest request)
    {
        var order = await repo.AddAsync(request.ToOrder());
        logger.LogInformation("Created order {OrderId} for {Customer} total {Total}",
            order.Id, order.Customer, order.Total);   // structured logging &mdash; named placeholders
        return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
        // 201 + Location: /api/orders/42 &mdash; the client can immediately GET what it made
    }
}</code></pre></div>
<div class="callout note"><div class="co-title">The DTO layer: why entities never cross the wire</div><p><code>CreateOrderRequest</code> (input) and <code>OrderSummary</code> (output) are <strong>DTOs</strong> &mdash; records shaped for the contract, not the database. Without them: mass-assignment attacks (client posts <code>IsAdmin=true</code> onto your entity), accidental data leaks (entity carries Salary/PasswordHash), and one DB column change breaking every client. Map at the edges &mdash; by hand or with Mapster/Mapperly &mdash; and keep entities inside the service layer.</p></div>

<h2>Validation that writes itself</h2>
<div class="codeblock"><div class="codeblock-header">DataAnnotations + automatic 400</div><pre><code>public record CreateOrderRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Customer { get; init; } = "";

    [Range(1, 100)]
    public List&lt;OrderLine&gt; Lines { get; init; } = [];

    [EmailAddress]
    public string? NotificationEmail { get; init; }

    [RegularExpression(@"^[A-Z]{2}-\d{4}$", ErrorMessage = "Format must be AA-1234")]
    public string? PurchaseOrder { get; init; }
}

public record OrderLine
{
    [Range(1, int.MaxValue)] public int ProductId { get; init; }
    [Range(1, 1000)]         public int Quantity { get; init; }
}

// [ApiController] auto-validates: invalid models NEVER reach your code &mdash;
// the response is 400 with a ProblemDetails body listing every field error:
// { "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
//   "title": "One or more validation errors occurred.",
//   "errors": { "Customer": ["The Customer field is required."] } }</code></pre></div>
<h3>Beyond attributes: cross-field and business rules</h3>
<div class="codeblock"><div class="codeblock-header">FluentValidation &mdash; rules as a testable class</div><pre><code>public class CreateOrderValidator : AbstractValidator&lt;CreateOrderRequest&gt;
{
    public CreateOrderValidator()
    {
        RuleFor(x =&gt; x.Customer).NotEmpty().MaximumLength(100);
        RuleFor(x =&gt; x.Lines).NotEmpty().WithMessage("Order needs at least one line");
        RuleForEach(x =&gt; x.Lines).ChildRules(line =&gt;
        {
            line.RuleFor(l =&gt; l.Quantity).InclusiveBetween(1, 1000);
        });
        RuleFor(x =&gt; x)                          // cross-field rule &mdash; impossible with attributes
            .Must(x =&gt; x.Lines.Sum(l =&gt; l.Quantity) &lt;= 10_000)
            .WithMessage("Total quantity exceeds limit");
    }
}
// builder.Services.AddValidatorsFromAssemblyContaining&lt;CreateOrderValidator&gt;();
// builder.Services.AddFluentValidationAutoValidation();   // wire into the same 400 pipeline

// Manual invocation inside a service (works with minimal APIs too):
var result = await validator.ValidateAsync(request, ct);
if (!result.IsValid) return Results.ValidationProblem(result.ToDictionary());</code></pre></div>
<div class="diagram-wrap">
<svg viewBox="0 0 820 130" width="820" height="130" role="img" aria-label="Request validation flow">
  <defs><marker id="d16a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="40" width="150" height="46" rx="8" fill="#f1f3f5" stroke="#8a919e"/><text x="95" y="60" text-anchor="middle" class="dg-text">JSON body</text><text x="95" y="76" text-anchor="middle" class="dg-sub">POST /api/orders</text>
  <rect x="230" y="40" width="170" height="46" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="315" y="60" text-anchor="middle" class="dg-text">Model binding</text><text x="315" y="76" text-anchor="middle" class="dg-sub">JSON &rarr; object</text>
  <rect x="460" y="40" width="150" height="46" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="535" y="60" text-anchor="middle" class="dg-text">Validation</text><text x="535" y="76" text-anchor="middle" class="dg-sub">annotations / FluentValidation</text>
  <rect x="670" y="20" width="130" height="38" rx="8" fill="#e7f8f1" stroke="#0e9f6e"/><text x="735" y="45" text-anchor="middle" class="dg-sub">200 / 201</text>
  <rect x="670" y="70" width="130" height="38" rx="8" fill="#fdecec" stroke="#dc2626"/><text x="735" y="95" text-anchor="middle" class="dg-sub">400 ProblemDetails</text>
  <line x1="170" y1="63" x2="228" y2="63" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d16a)"/>
  <line x1="400" y1="63" x2="458" y2="63" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d16a)"/>
  <line x1="610" y1="55" x2="668" y2="42" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d16a)"/>
  <line x1="610" y1="72" x2="668" y2="85" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d16a)"/>
</svg>
</div>

<h2>OpenAPI: the contract clients generate from</h2>
<p><code>AddOpenApi()</code> + <code>MapOpenApi()</code> produce a machine-readable description of every endpoint, parameter, and status code (from those <code>ProducesResponseType</code> attributes). Swagger UI (or Scalar in .NET 9+) renders it into a live documentation page. Contract-first clients (TypeScript, C#, mobile) generate from this file &mdash; that is why the attributes matter.</p>

<h2>CORS: the browser rule you will meet on every SPA project</h2>
<p>When a page served from <code>https://app.example.com</code> calls <code>https://api.example.com</code>, the browser demands the server <em>opt in</em> via CORS headers. The server is not protecting itself &mdash; it is instructing the <em>browser</em> on which origins may call it. Preflight: for non-simple requests the browser sends <code>OPTIONS</code> first; the server must bless the method/headers <em>before</em> the real call. That is why <code>UseCors</code> must precede <code>UseAuthentication</code> &mdash; preflights carry no token.</p>
<div class="codeblock"><div class="codeblock-header">Cors.cs</div><pre><code>builder.Services.AddCors(o =&gt; o.AddPolicy("spa", p =&gt; p
    .WithOrigins("https://app.example.com", "http://localhost:3000")  // exact, no trailing /
    .AllowAnyHeader()
    .WithMethods("GET", "POST", "PUT", "DELETE")
    .AllowCredentials()));                       // only when sending cookies; never *

var products = app.MapGroup("/products").RequireCors("spa");   // policy per group/endpoint
// NEVER: AllowAnyOrigin() + AllowCredentials() &mdash; the browser rejects it, and you deserve it</code></pre></div>

<h2>API versioning without breaking v1</h2>
<p>The moment real clients exist, breaking changes need a new version while v1 lives on. The <code>Asp.Versioning</code> packages give you URL/header/query versioning with a shared implementation.</p>
<div class="codeblock"><div class="codeblock-header">Versioning.cs</div><pre><code>builder.Services.AddApiVersioning(o =&gt;
{
    o.DefaultApiVersion = new ApiVersion(1, 0);
    o.AssumeDefaultVersionWhenUnspecified = true;
    o.ReportApiVersions = true;                 // response header: api-supported-versions: 1.0, 2.0
}).AddApiExplorer(o =&gt; o.GroupNameFormat = "'v'VVV");   // feeds OpenAPI per version

// URL style (most discoverable):
var v1 = app.NewVersionedApi("Orders").MapGroup("/api/v{version:apiVersion}");
v1.MapGet("/orders", GetOrdersV1).HasApiVersion(1.0);
v1.MapGet("/orders", GetOrdersV2)               // v2 endpoint lives beside v1
  .HasApiVersion(2.0);
// /api/v1/orders and /api/v2/orders &mdash; deprecate v1 with o.DeprecatingApiVersion</code></pre></div>

<h2>Caching and concurrency &mdash; the HTTP features you already have</h2>
<div class="codeblock"><div class="codeblock-header">Cache.cs &mdash; ETags and output caching</div><pre><code>// Output caching &mdash; server-side, .NET 7+ (anonymous GETs only by default):
builder.Services.AddOutputCache(o =&gt; o.AddPolicy("short", b =&gt; b.Expire(TimeSpan.FromSeconds(30))));
app.MapGet("/catalog", GetCatalog).CacheOutput("short");

// ETag &mdash; optimistic concurrency clients can honor (if-none-match / if-match):
app.MapGet("/orders/{id:int}", async (int id, IOrderRepository repo) =&gt;
{
    var order = await repo.GetAsync(id);
    if (order is null) return Results.NotFound();
    var etag = $"\"{order.RowVersion}\"";                       // from a version/timestamp
    return ctx.Request.Headers.IfNoneMatch == etag
        ? Results.StatusCode(StatusCodes.Status304NotModified)  // client cache still valid
        : Results.Ok(order).WithHeader("ETag", etag);
});

// Optimistic writes &mdash; reject stale overwrites with 409/412:
app.MapPut("/orders/{id:int}", async (int id, UpdateOrderRequest req,
    IOrderRepository repo, HttpContext ctx) =&gt;
{
    var etag = ctx.Request.Headers.IfMatch.FirstOrDefault()?.Trim('"');
    var updated = await repo.UpdateIfVersionAsync(id, etag, req.ToOrder());
    return updated switch
    {
        UpdateResult.NotFound       =&gt; Results.NotFound(),
        UpdateResult.VersionConflict =&gt; Results.StatusCode(412),   // Precondition Failed
        _                           =&gt; Results.NoContent()
    };
});</code></pre></div>

<h2>Hypermedia &amp; the shapes of REST maturity (for context, not dogma)</h2>
<p>The Richardson maturity model: level 0 = one RPC-ish URL; level 1 = resource URLs; level 2 = proper methods + status codes (where most good APIs live); level 3 = HATEOAS &mdash; responses carry links telling clients what they can do next (<code>"links": {"cancel": "/orders/7/cancel"}</code>). Level 3 is powerful for public/evolving APIs but adds ceremony; know it, and choose deliberately.</p>

<h2>Pagination, filtering, versioning &mdash; the professional checklist</h2>
<ul>
  <li><strong>Pagination</strong>: <code>?page=2&amp;pageSize=20</code> with a total count; never unbounded lists. Clamp pageSize (&le;100) &mdash; a client asking for a million rows is a DoS you built.</li>
  <li><strong>Filtering</strong>: query params map to repository filters; whitelist sortable/filterable fields.</li>
  <li><strong>Versioning</strong>: URL or header; ship v2 while v1 still works; announce deprecation windows.</li>
  <li><strong>Idempotency</strong>: PUT/DELETE retry safely; for POST retries pass an <code>Idempotency-Key</code> header and dedupe server-side.</li>
  <li><strong>Errors</strong>: ProblemDetails (RFC 7807/9457) everywhere &mdash; type, title, detail, traceId.</li>
  <li><strong>CORS</strong>: explicit origins, never <code>AllowAnyOrigin + AllowCredentials</code>.</li>
  <li><strong>Consistency</strong>: same paging envelope, same error shape, same casing (camelCase) on every endpoint.</li>
</ul>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (40 min)</div>
<p>Harden yesterday's task API: pagination with a clamped pageSize, a <code>GET /tasks?status=open&amp;priority=high</code> filter, ProblemDetails on all errors, a <code>DELETE</code> with 204/404, and DTOs separating request/response from the entity. Add a FluentValidation rule that DataAnnotations cannot express (cross-field), a CORS policy for <code>http://localhost:3000</code>, and an ETag check on <code>PUT</code> that returns 412 on stale writes. Document everything with ProducesResponseType and inspect the OpenAPI JSON &mdash; can a client team build against it blind?</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Resources + methods + status codes = the REST contract; design URLs first.</li>
  <li>DTOs at the boundary &mdash; entities never cross the wire (security + stability).</li>
  <li>Validation at the boundary: attributes for shape, FluentValidation for rules.</li>
  <li>CORS before auth; version before you break; paginate and clamp everything.</li>
  <li>ETags/output caching are built in &mdash; use the platform before writing your own.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Add <code>If-Match</code>/<code>ETag</code> support to <code>PUT /tasks/{id}</code> returning 412 on mismatch.</li><li>Implement an idempotency-key middleware: same key &rarr; replay the stored response (in a <code>ConcurrentDictionary</code>).</li><li>Add a v2 endpoint where status becomes an enum-as-string, and run both versions side by side.</li></ul>
`,
  quiz: [
    {
      "q": "POST /api/orders that creates order 42 should return…",
      "a": [
        "200 with the object",
        "201 with a Location: /api/orders/42 header",
        "204",
        "302"
      ],
      "correct": 1,
      "expl": "201 + Location lets clients immediately GET the new resource."
    },
    {
      "q": "Entities should not cross the API boundary because of…",
      "a": [
        "Performance",
        "Mass-assignment attacks, data leaks, and schema coupling",
        "JSON size",
        "Compiler rules"
      ],
      "correct": 1,
      "expl": "DTOs shape the contract; entities stay inside."
    },
    {
      "q": "A rule like 'total quantity across lines ≤ 10000' belongs in…",
      "a": [
        "A DataAnnotation on Lines",
        "FluentValidation cross-field rule or service logic",
        "The route constraint",
        "A comment"
      ],
      "correct": 1,
      "expl": "Cross-field rules need validator classes or domain services."
    },
    {
      "q": "Stale ETag on a PUT should return…",
      "a": [
        "400",
        "412 Precondition Failed",
        "409",
        "500"
      ],
      "correct": 1,
      "expl": "412 tells the client its cached version is outdated; 409 is for state conflicts."
    }
  ]

};