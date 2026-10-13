/* Day 24: Microservices & gRPC */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[24] = {
  html: `
<p>Microservices split a monolith into independently deployable services around business capabilities. Today: when to split, how they talk (REST, gRPC, messages), and how .NET keeps them resilient.</p>

<h2>Monolith vs services &mdash; honestly</h2>
<div class="table-wrap"><table>
<thead><tr><th></th><th>Modular monolith</th><th>Microservices</th></tr></thead>
<tbody>
<tr><td>Deploy unit</td><td>one app</td><td>many small apps</td></tr>
<tr><td>Data</td><td>one schema</td><td>database per service</td></tr>
<tr><td>Consistency</td><td>ACID transactions</td><td>eventual (events/sagas)</td></tr>
<tr><td>Scaling</td><td>whole app</td><td>per service</td></tr>
<tr><td>Team fit</td><td>small teams</td><td>many teams, independent deploys</td></tr>
</tbody></table></div>
<div class="callout warning"><div class="co-title">Start modular</div><p>Almost every system should start as a <strong>modular monolith</strong>: strict module boundaries inside one deployable. Extract services only when a module has genuinely different scaling, deployment, or team needs &mdash; distributed systems trade easy consistency for autonomy.</p></div>

<h2>Service communication</h2>
<div class="table-wrap"><table>
<thead><tr><th>Channel</th><th>Style</th><th>Best for</th><th>Contract</th></tr></thead>
<tbody>
<tr><td>REST/JSON</td><td>sync, HTTP</td><td>public APIs, broad clients</td><td>OpenAPI</td></tr>
<tr><td><strong>gRPC</strong></td><td>sync, HTTP/2 binary</td><td>internal service-to-service, streaming, perf</td><td>.proto file</td></tr>
<tr><td>Message queue</td><td>async events</td><td>decoupling, retries, load leveling</td><td>schema in code/envelope</td></tr>
</tbody></table></div>

<h2>gRPC: contract-first RPC</h2>
<div class="codeblock"><div class="codeblock-header">orders.proto</div><pre><code>syntax = "proto3";
option csharp_namespace = "Orders.Grpc";

service OrderGrpc {
  rpc GetOrder (OrderRequest) returns (OrderReply);
  rpc WatchOrders (OrderRequest) returns (stream OrderReply);   // server streaming!
}

message OrderRequest  { int32 id = 1; }
message OrderReply    { int32 id = 1; decimal total = 2; string status = 3; }</code></pre></div>
<div class="codeblock"><div class="codeblock-header">Server + client &mdash; the whole ceremony</div><pre><code>// Server (ASP.NET Core):
builder.Services.AddGrpc();
app.MapGrpcService&lt;OrderGrpcService&gt;();

public class OrderGrpcService(IOrderRepository repo) : OrderGrpc.OrderGrpcBase
{
    public override async Task&lt;OrderReply&gt; GetOrder(OrderRequest req, ServerCallContext ctx)
    {
        var o = await repo.GetAsync(req.Id) ?? throw new RpcException(
            new Status(StatusCode.NotFound, $"Order {req.Id}"));
        return new OrderReply { Id = o.Id, Total = o.Total, Status = o.Status };
    }
}

// Client (another service):
using var channel = GrpcChannel.ForAddress("https://orders:5001");
var client = new OrderGrpc.OrderGrpcClient(channel);
var reply = await client.GetOrderAsync(new OrderRequest { Id = 7 });
Console.WriteLine(reply.Total);</code></pre></div>
<div class="callout note"><div class="co-title">Why internal gRPC</div><p>Binary protobuf is 3&ndash;10&times; smaller and much faster to parse than JSON; HTTP/2 multiplexes concurrent calls; the .proto file is a strictly-versioned contract both sides generate code from. Browsers cannot speak it directly &mdash; that is what the REST gateway is for.</p></div>

<h2>Resilience: assume every call can fail</h2>
<div class="codeblock"><div class="codeblock-header">Polly + HttpClientFactory</div><pre><code>builder.Services.AddHttpClient&lt;IOrdersClient, OrdersClient&gt;(c =&gt;
        c.BaseAddress = new Uri(builder.Configuration["Services:Orders"]!))
    .AddStandardResilienceHandler();    // Microsoft.Extensions.Http.Resilience

// Standard handler = retry with backoff + circuit breaker + timeout:
//   transient failures retried, cascading failures short-circuited.</code></pre></div>
<div class="diagram-wrap">
<svg viewBox="0 0 820 190" width="820" height="190" role="img" aria-label="Resilience pipeline">
  <defs><marker id="d24a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="60" width="150" height="50" rx="8" fill="#f1f3f5" stroke="#8a919e"/><text x="95" y="80" text-anchor="middle" class="dg-text">Call</text><text x="95" y="96" text-anchor="middle" class="dg-sub">orders service</text>
  <rect x="220" y="60" width="130" height="50" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="285" y="80" text-anchor="middle" class="dg-text">Timeout</text><text x="285" y="96" text-anchor="middle" class="dg-sub">cap the wait</text>
  <rect x="400" y="60" width="130" height="50" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="465" y="80" text-anchor="middle" class="dg-text">Retry</text><text x="465" y="96" text-anchor="middle" class="dg-sub">backoff + jitter</text>
  <rect x="580" y="60" width="150" height="50" rx="8" fill="#fdecec" stroke="#dc2626"/><text x="655" y="80" text-anchor="middle" class="dg-text">Circuit breaker</text><text x="655" y="96" text-anchor="middle" class="dg-sub">fail fast when down</text>
  <line x1="170" y1="85" x2="218" y2="85" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d24a)"/>
  <line x1="350" y1="85" x2="398" y2="85" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d24a)"/>
  <line x1="530" y1="85" x2="578" y2="85" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d24a)"/>
  <text x="410" y="150" text-anchor="middle" class="dg-sub">async events (queue) add temporal decoupling: receiver can be down; messages wait</text>
</svg>
</div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (45 min)</div>
<p>Split the tracker into two services: <code>Tasks.Api</code> (owns its SQLite) and <code>Reports.Api</code> that reads tasks over gRPC to build daily summaries. Add the resilience handler with aggressive timeout, then kill the tasks service and watch Reports fail fast and recover when it returns. Write down where the coupling still hurts &mdash; that list is your extraction checklist.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Split by business capability, not by technical layers.</li>
  <li>gRPC + protobuf for internal contracts; REST for the edge.</li>
  <li>Retry + circuit breaker + timeout on every remote call, no exceptions.</li>
  <li>Database-per-service means eventual consistency &mdash; design for it up front.</li>
</ul>
`
};
