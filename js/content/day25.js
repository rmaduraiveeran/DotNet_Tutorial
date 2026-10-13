/* Day 25: Microsoft Orleans */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[25] = {
  html: `
<p>Orleans is Microsoft's actor framework, powering Xbox cloud services and Azure experiences at planet scale. It gives you millions of lightweight virtual actors &mdash; <strong>grains</strong> &mdash; that live behind ordinary .NET interfaces.</p>

<h2>The virtual actor model</h2>
<p>A grain is a unit of state + behavior addressed by identity (<code>interface + key</code>). Unlike classic actors, Orleans grains <strong>always exist logically</strong>: calling one activates it on some server, transparently; idle grains deactivate and their state persists. No lifecycle code, no placement logic, no lookup service.</p>
<div class="diagram-wrap">
<svg viewBox="0 0 820 220" width="820" height="220" role="img" aria-label="Orleans cluster and grains">
  <defs><marker id="d25a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="70" width="150" height="50" rx="8" fill="#f1f3f5" stroke="#8a919e"/><text x="95" y="90" text-anchor="middle" class="dg-text">Client</text><text x="95" y="106" text-anchor="middle" class="dg-sub">IGrainFactory</text>
  <rect x="230" y="20" width="250" height="160" rx="12" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="355" y="45" text-anchor="middle" class="dg-text">Silo (cluster node)</text>
  <rect x="255" y="60" width="90" height="40" rx="6" fill="#e7f8f1" stroke="#0e9f6e"/><text x="300" y="85" text-anchor="middle" class="dg-sub">CartGrain:42</text>
  <rect x="360" y="60" width="90" height="40" rx="6" fill="#e7f8f1" stroke="#0e9f6e"/><text x="405" y="85" text-anchor="middle" class="dg-sub">SessionGrain:X</text>
  <rect x="255" y="115" width="90" height="40" rx="6" fill="#e7f8f1" stroke="#0e9f6e"/><text x="300" y="140" text-anchor="middle" class="dg-sub">DeviceGrain:Y</text>
  <rect x="360" y="115" width="90" height="40" rx="6" fill="#fdecec" stroke="#dc2626"/><text x="405" y="140" text-anchor="middle" class="dg-sub">deactivated&#8230;</text>
  <rect x="540" y="20" width="250" height="160" rx="12" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="665" y="45" text-anchor="middle" class="dg-text">Silo (node 2)</text>
  <rect x="565" y="60" width="90" height="40" rx="6" fill="#e7f8f1" stroke="#0e9f6e"/><text x="610" y="85" text-anchor="middle" class="dg-sub">CartGrain:7</text>
  <rect x="670" y="60" width="90" height="40" rx="6" fill="#e7f8f1" stroke="#0e9f6e"/><text x="715" y="85" text-anchor="middle" class="dg-sub">PlayerGrain:Z</text>
  <line x1="170" y1="95" x2="228" y2="95" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d25a)"/>
  <text x="410" y="205" text-anchor="middle" class="dg-sub">one grain instance per identity cluster-wide &mdash; placement is automatic, calls route to wherever it lives</text>
</svg>
</div>

<h2>Defining and using a grain</h2>
<div class="codeblock"><div class="codeblock-header">Grains &mdash; interface + implementation + persistence</div><pre><code>// 1. The contract (shared assembly) &mdash; just an interface:
public interface ICartGrain : IGrainWithStringKey
{
    Task AddAsync(string sku, int quantity);
    Task&lt;CartSummary&gt; GetSummaryAsync();
    Task CheckoutAsync();
}

// 2. The implementation &mdash; single-threaded by design (no locks needed!):
public class CartGrain(
    [PersistentState("cart", "shoppingCart")] IPersistentState&lt;CartState&gt; cart)
    : Grain, ICartGrain
{
    public async Task AddAsync(string sku, int quantity)
    {
        cart.State.Items[sku] = cart.State.Items.GetValueOrDefault(sku) + quantity;
        await cart.WriteStateAsync();          // persist via storage provider
    }

    public Task&lt;CartSummary&gt; GetSummaryAsync() =&gt;
        Task.FromResult(new CartSummary(cart.State.Items.Count,
            cart.State.Items.Values.Sum()));

    public async Task CheckoutAsync()
    {
        // publish event, clear state &mdash; grains coordinate other grains too:
        var inventory = GrainFactory.GetGrain&lt;IInventoryGrain&gt;(/* key */);
        await inventory.ReserveAsync(/* ... */);
        cart.State = new CartState();
        await cart.WriteStateAsync();
    }
}</code></pre></div>

<h2>Host and client</h2>
<div class="codeblock"><div class="codeblock-header">Silo + client setup (co-hosted in ASP.NET Core)</div><pre><code>// Silo inside the web app &mdash; one process, simplest topology:
builder.Host.UseOrleans(silo =&gt;
{
    silo.UseLocalhostClustering()
        .AddMemoryGrainStorage("shoppingCart")     // swap for Azure Table/Cosmos/DynamoDB in prod
        .UseStateMachineWorkflows();               // optional addons
});

// Anywhere in an endpoint or service &mdash; grain handles arrive like magic:
IGrainFactory grains = ...;
var cart = grains.GetGrain&lt;ICartGrain&gt;("user-42");   // activates or reuses
await cart.AddAsync("sku-9", 2);
var summary = await cart.GetSummaryAsync();</code></pre></div>
<div class="callout tip"><div class="co-title">When Orleans (vs plain services)</div><p>Great fit: stateful interactive entities (carts, sessions, players, devices, IoT), high write concurrency on the same entity, game/event/telecom backends. Poor fit: mostly-CRUD apps over a relational DB &mdash; EF Core + an API is simpler there. Grains are also <em>not</em> a cache: they are your state owner.</p></div>

<h2>Why single-threaded grains remove locks</h2>
<p>Orleans guarantees at most one request executes per grain at a time (turn-based concurrency). No race conditions on grain state, no locks, no atomics &mdash; concurrency is achieved by <em>distribution across many grains</em>, not by shared-state juggling. This is the same insight Erlang/Akka had, made invisible behind interfaces.</p>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (45 min)</div>
<p>Build a live multi-user counter: a <code>ICounterGrain : IGrainWithStringKey</code> with <code>Increment/GetValue</code> persisted via <code>IPersistentState</code>, hosted in a minimal API (<code>POST /counters/{id}/inc</code>). Open two browser tabs against the same counter and verify the cluster dedupes activations. Then add a <code>StatsGrain</code> that aggregates all counters &mdash; a grain calling grains, no locks anywhere.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Grains = virtual actors: always addressable, placed and persisted automatically.</li>
  <li>Identity is <code>(interface, key)</code>; state via storage providers.</li>
  <li>Turn-based execution eliminates locks by construction.</li>
  <li>Ideal for stateful, interactive, write-heavy entity workloads.</li>
</ul>
`
};
