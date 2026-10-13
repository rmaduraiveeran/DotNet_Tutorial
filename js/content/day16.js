/* Day 16: Web APIs & REST Design */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[16] = {
  html: `
<p>Yesterday you made endpoints work. Today you make them <em>good</em>: resource design, status codes, validation, and contracts clients can trust.</p>

<h2>REST in one diagram</h2>
<p>REST models your domain as <strong>resources</strong> addressed by URLs, manipulated through HTTP methods, with status codes as the outcome contract.</p>
<div class="table-wrap"><table>
<thead><tr><th>Method</th><th>URL</th><th>Meaning</th><th>Success code</th></tr></thead>
<tbody>
<tr><td>GET</td><td><code>/api/orders</code></td><td>list (paged!)</td><td>200</td></tr>
<tr><td>GET</td><td><code>/api/orders/7</code></td><td>fetch one</td><td>200 / 404</td></tr>
<tr><td>POST</td><td><code>/api/orders</code></td><td>create</td><td>201 + <code>Location</code></td></tr>
<tr><td>PUT</td><td><code>/api/orders/7</code></td><td>replace entirely</td><td>200 / 404</td></tr>
<tr><td>PATCH</td><td><code>/api/orders/7</code></td><td>partial update</td><td>200 / 404</td></tr>
<tr><td>DELETE</td><td><code>/api/orders/7</code></td><td>remove</td><td>204 / 404</td></tr>
</tbody></table></div>
<div class="callout note"><div class="co-title">Status codes are the contract</div><p>2xx = success (201 created, 204 no content). 4xx = caller's fault (400 validation, 401 unauthenticated, 403 forbidden, 404 missing, 409 conflict). 5xx = your fault. Returning 200 with <code>{"error": ...}</code> in the body is how trust dies.</p></div>

<h2>A well-designed controller</h2>
<div class="codeblock"><div class="codeblock-header">OrdersController.cs</div><pre><code>[ApiController]
[Route("api/[controller]")]                 // /api/orders
public class OrdersController(
    IOrderRepository repo,
    ILogger&lt;OrdersController&gt; logger) : ControllerBase
{
    [HttpGet]
    public async Task&lt;ActionResult&lt;PagedResult&lt;OrderSummary&gt;&gt;&gt; List(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
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
            : NotFound();

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task&lt;ActionResult&lt;Order&gt;&gt; Create(CreateOrderRequest request)
    {
        var order = await repo.AddAsync(request.ToOrder());
        logger.LogInformation("Created order {OrderId}", order.Id);
        return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
    }
}</code></pre></div>

<h2>Validation that writes itself</h2>
<div class="codeblock"><div class="codeblock-header">DataAnnotations + automatic 400</div><pre><code>public record CreateOrderRequest
{
    [Required, StringLength(100)]
    public string Customer { get; init; } = "";

    [Range(1, 100)]
    public List&lt;OrderLine&gt; Lines { get; init; } = [];
}

public record OrderLine
{
    [Range(1, int.MaxValue)] public int ProductId { get; init; }
    [Range(1, 1000)]         public int Quantity { get; init; }
}

// [ApiController] auto-validates: invalid models never reach your code &mdash;
// the response is 400 with a ProblemDetails body listing every field error.</code></pre></div>
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

<h2>Pagination, filtering, versioning &mdash; the professional checklist</h2>
<ul>
  <li><strong>Pagination</strong>: <code>?page=2&amp;pageSize=20</code> with a total count; never unbounded lists.</li>
  <li><strong>Filtering</strong>: query params map to repository filters; validate and clamp pageSize.</li>
  <li><strong>Versioning</strong>: URL (<code>/api/v2/orders</code>) or header; ship v2 while v1 still works.</li>
  <li><strong>Idempotency</strong>: PUT/DELETE can be retried safely; POST gets an idempotency key.</li>
  <li><strong>Errors</strong>: ProblemDetails (RFC 7807) everywhere &mdash; type, title, detail, traceId.</li>
</ul>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (40 min)</div>
<p>Harden yesterday's task API: pagination on the list endpoint, a <code>GET /tasks?status=open&amp;priority=high</code> filter, ProblemDetails on all errors, and a <code>DELETE</code> with 204/404. Document every endpoint with ProducingResponseType attributes and inspect the generated OpenAPI JSON &mdash; can a client team build against it blind?</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Resources + methods + status codes = the REST contract.</li>
  <li>Validation belongs at the boundary; 400s are free with [ApiController].</li>
  <li>OpenAPI is documentation you cannot forget to update.</li>
  <li>Paginate everything; version before you break the contract.</li>
</ul>
`
};
