/* Day 18: MVC & Razor Views */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[18] = {
  html: `
<p>Before minimal APIs there was &mdash; and still is &mdash; the MVC pattern: Models carry data, Views render HTML, Controllers coordinate. It remains the right choice for server-rendered websites and forms-heavy apps.</p>

<h2>The request's round trip</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 180" width="820" height="180" role="img" aria-label="MVC flow">
  <defs><marker id="d18a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="65" width="130" height="50" rx="8" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.4"/><text x="85" y="86" text-anchor="middle" class="dg-text">Browser</text><text x="85" y="102" text-anchor="middle" class="dg-sub">GET /orders/7</text>
  <rect x="220" y="65" width="160" height="50" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.4"/><text x="300" y="86" text-anchor="middle" class="dg-text">Controller</text><text x="300" y="102" text-anchor="middle" class="dg-sub">routing &rarr; action</text>
  <rect x="450" y="20" width="150" height="46" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="525" y="41" text-anchor="middle" class="dg-text">Model</text><text x="525" y="57" text-anchor="middle" class="dg-sub">data + rules</text>
  <rect x="450" y="115" width="150" height="46" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.4"/><text x="525" y="136" text-anchor="middle" class="dg-text">View (Razor)</text><text x="525" y="152" text-anchor="middle" class="dg-sub">CSHTML template</text>
  <rect x="670" y="65" width="130" height="50" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="735" y="95" text-anchor="middle" class="dg-text">HTML response</text>
  <line x1="150" y1="90" x2="218" y2="90" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d18a)"/>
  <line x1="380" y1="80" x2="448" y2="48" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d18a)"/>
  <line x1="380" y1="100" x2="448" y2="132" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d18a)"/>
  <line x1="600" y1="132" x2="668" y2="100" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d18a)"/>
  <line x1="600" y1="43" x2="668" y2="80" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d18a)"/>
</svg>
</div>

<h2>A controller and its view</h2>
<p>Controllers are classes instantiated <em>per request</em> from DI; their public methods (&ldquo;actions&rdquo;) handle a URL. The same binding, filters, and results machinery from Day 16 powers them &mdash; MVC adds conventions: views resolve by name from <code>Views/{Controller}/{Action}.cshtml</code>, and <code>ControllerBase</code> extras (<code>View()</code>, <code>TempData</code>, <code>User</code>) exist for HTML flows.</p>
<div class="codeblock"><div class="codeblock-header">OrdersController.cs</div><pre><code>public class OrdersController(IOrderRepository repo) : Controller
{
    // GET /orders &mdash; list view
    public async Task&lt;IActionResult&gt; Index(int page = 1)        // bound from query string
    {
        var model = new OrderListViewModel
        {
            Orders = await repo.GetPagedAsync(page, 20),
            CurrentPage = page
        };
        return View(model);                 // renders Views/Orders/Index.cshtml
    }

    // GET /orders/details/7 &mdash; route data binds too: /orders/details/{id}
    public async Task&lt;IActionResult&gt; Details(int id) =&gt;
        await repo.GetAsync(id) is { } order ? View(order) : NotFound();

    // POST /orders/7/delete &mdash; form post with anti-forgery check
    [HttpPost, ValidateAntiForgeryToken]
    public async Task&lt;IActionResult&gt; Delete(int id)
    {
        await repo.DeleteAsync(id);
        TempData["Status"] = "Order deleted.";       // survives one redirect (cookie-backed)
        return RedirectToAction(nameof(Index));     // Post-Redirect-Get pattern
    }
}</code></pre></div>
<h3>Action filters: cross-cutting per action</h3>
<div class="codeblock"><div class="codeblock-header">Filters.cs &mdash; the MVC answer to middleware, scoped to actions</div><pre><code>public class LogActionFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext ctx)   { /* before the action */ }
    public void OnActionExecuted(ActionExecutedContext ctx)     { /* after; ctx.Exception visible here */ }
}
// Apply: [ServiceFilter(typeof(LogActionFilter))] (DI-resolved) or [TypeFilter(...)]
// Filter pipeline order: Authorization &rarr; Resource &rarr; Action &rarr; Exception &rarr; Result
// (Minimal APIs skip this pipeline &mdash; they have endpoint filters, Day 16's cousin:
//  app.MapGet(...).AddEndpointFilter(async (ctx, next) =&gt; { ...; return await next(ctx); }))</code></pre></div>
<h3>Model binding sources &mdash; where form data comes from</h3>
<div class="table-wrap"><table>
<thead><tr><th>Source</th><th>Attribute</th><th>Typical use</th></tr></thead>
<tbody>
<tr><td>Route segment</td><td><code>[FromRoute]</code> (default for simple types)</td><td><code>/orders/{id}</code></td></tr>
<tr><td>Query string</td><td><code>[FromQuery]</code></td><td>search, paging, filters</td></tr>
<tr><td>Form body</td><td><code>[FromForm]</code></td><td>HTML forms (MVC default for POST views)</td></tr>
<tr><td>JSON body</td><td><code>[FromBody]</code></td><td>APIs (minimal API default for complex types)</td></tr>
<tr><td>Header</td><td><code>[FromHeader]</code></td><td>tenant IDs, idempotency keys</td></tr>
</tbody></table></div>
<div class="codeblock"><div class="codeblock-header">Views/Orders/Index.cshtml</div><pre><code>@model OrderListViewModel          &lt;!-- strongly typed! --&gt;
@{
    ViewData["Title"] = "Orders";
}

&lt;h1&gt;Orders&lt;/h1&gt;

@if (!Model.Orders.Any())
{
    &lt;p class="muted"&gt;No orders yet.&lt;/p&gt;
}
else
{
    &lt;table class="table"&gt;
    @foreach (var order in Model.Orders)
    {
        &lt;tr&gt;
            &lt;td&gt;@order.Id&lt;/td&gt;
            &lt;td&gt;@order.Total.ToString("C")&lt;/td&gt;
            &lt;td&gt;&lt;a asp-action="Details" asp-route-id="@order.Id"&gt;view&lt;/a&gt;&lt;/td&gt;
        &lt;/tr&gt;
    }
    &lt;/table&gt;
}

&lt;!-- Tag helpers make links and forms compile-time checked --&gt;
&lt;a asp-action="Create" class="btn btn-primary"&gt;New order&lt;/a&gt;

@if (TempData["Status"] is string status)
{
    &lt;div class="alert alert-success"&gt;@status&lt;/div&gt;
}</code></pre></div>
<div class="callout note"><div class="co-title">Razor in one minute</div><p><code>@</code> switches from HTML to C#; <code>@model</code> types the view; tag helpers (<code>asp-action</code>, <code>asp-for</code>) generate correct URLs and form fields from your model &mdash; rename a property and the compiler tells you which views broke.</p></div>

<h2>The view hierarchy: layouts, partials, components</h2>
<div class="codeblock"><div class="codeblock-header">Views/Shared/_Layout.cshtml &mdash; every page's shell</div><pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;@ViewData["Title"] - MyApp&lt;/title&gt;   &lt;!-- set by each view above --&gt;
    &lt;link rel="stylesheet" href="~/css/site.css" /&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;header&gt;...nav from _ViewImports/_ViewStart conventions...&lt;/header&gt;
    &lt;main class="container"&gt;
        @RenderBody()                             &lt;!-- the view lands here --&gt;
    &lt;/main&gt;
    @await RenderSectionAsync("Scripts", required: false)   &lt;!-- optional per-view scripts --&gt;
&lt;/body&gt;
&lt;/html&gt;

@* Views/_ViewStart.cshtml:  @{ Layout = "_Layout"; }  &mdash; applies to all views *@
@* Views/_ViewImports.cshtml: @using / @addTagHelper &mdash; applies to all views *@</code></pre></div>
<div class="codeblock"><div class="codeblock-header">Partial vs View Component &mdash; know the difference</div><pre><code>@* 1. PARTIAL &mdash; pure template, same model, no logic of its own: *@
&lt;partial name="_OrderRow" model="order" /&gt;
@* _OrderRow.cshtml: @model Order  &mdash; a reusable row rendering *@

@* 2. VIEW COMPONENT &mdash; mini-controller + view, with its own logic + DI: *@
@await Component.InvokeAsync("CartSummary")
@* Components/CartSummaryViewComponent.cs: *@
public class CartSummaryViewComponent(ICartService cart) : ViewComponent
{
    public IViewComponentResult Invoke() =&gt;
        View(new CartSummaryViewModel(cart.Items.Count(), cart.Total));
}
@* Views/Shared/Components/CartSummary/Default.cshtml renders it *@
@* Use for: shopping carts, login panels, tag clouds &mdash; anything with logic + markup *@</code></pre></div>

<h2>Forms with tag helpers: types from your model</h2>
<div class="codeblock"><div class="codeblock-header">Views/Orders/Create.cshtml</div><pre><code>@model CreateOrderViewModel

&lt;form asp-action="Create" method="post"&gt;
    @* antiforgery token auto-included in &lt;form&gt; tag helpers *@
    &lt;div class="form-group"&gt;
        &lt;label asp-for="Customer"&gt;&lt;/label&gt;                @* label text from [Display] *@
        &lt;input asp-for="Customer" class="form-control" />  @* input type from the property type *@
        &lt;span asp-validation-for="Customer" class="text-danger"&gt;&lt;/span&gt;
    &lt;/div&gt;
    &lt;button type="submit" class="btn btn-primary"&gt;Create&lt;/button&gt;
    &lt;div asp-validation-summary="All" class="text-danger"&gt;&lt;/div&gt;
&lt;/form&gt;

@section Scripts {                                @* lands in layout's RenderSectionAsync *@
    &lt;script src="~/lib/jquery-validation/dist/jquery.validate.min.js"&gt;&lt;/script&gt;
    @* client-side validation mirrors the SAME DataAnnotations &mdash; one rule, two validations *@
}</code></pre></div>
<div class="codeblock"><div class="codeblock-header">Controller round trip &mdash; the create flow</div><pre><code>[HttpGet]  public IActionResult Create() =&gt; View(new CreateOrderViewModel());

[HttpPost, ValidateAntiForgeryToken]
public async Task&lt;IActionResult&gt; Create(CreateOrderViewModel vm)
{
    if (!ModelState.IsValid) return View(vm);   // redisplay WITH errors + entered values
    var id = await repo.AddAsync(vm.ToOrder());
    TempData["Status"] = $"Order {id} created";
    return RedirectToAction(nameof(Index));      // never render after POST &mdash; PRG prevents double-submit
}</code></pre></div>

<h2>ViewModels: the professional habit</h2>
<p>Never hand your entity classes to views. A ViewModel contains exactly what the screen needs: display strings, page numbers, select lists. Your domain model stays free of UI concerns, a malicious user cannot post fields you never displayed (<em>over-posting / mass-assignment</em>), and validation attributes decorate the screen contract, not the database entity.</p>
<div class="codeblock"><div class="codeblock-header">ViewModel vs entity &mdash; same data, different contracts</div><pre><code>// Domain entity &mdash; owns rules, no UI concerns:
public class Order { public int Id; public decimal Total; public string InternalNotes; /* ... */ }

// Screen contract &mdash; only what the list page shows:
public record OrderListViewModel
{
    public required IEnumerable&lt;OrderRow&gt; Orders { get; init; }
    public int CurrentPage { get; init; }
    public int TotalPages { get; init; }
}
public record OrderRow(int Id, string FormattedTotal, string StatusColor);  // display-ready</code></pre></div>

<h2>MVC vs minimal APIs vs Blazor</h2>
<div class="table-wrap"><table>
<thead><tr><th></th><th>Minimal APIs</th><th>MVC</th><th>Blazor</th></tr></thead>
<tbody>
<tr><td>Best for</td><td>JSON APIs</td><td>Server-rendered sites, forms-heavy apps</td><td>Rich interactive UIs</td></tr>
<tr><td>Client JS</td><td>n/a</td><td>A little (validation, modest interactivity)</td><td>C# instead of JS</td></tr>
<tr><td>Structure</td><td>Endpoint functions</td><td>Controllers/Views folders</td><td>Components (.razor)</td></tr>
<tr><td>State</td><td>stateless</td><td>TempData/cookies/forms</td><td>component state + DI</td></tr>
<tr><td>Learning order</td><td>Day 15</td><td>Day 18</td><td>Day 19</td></tr>
</tbody></table></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (40 min)</div>
<p>Build an MVC front-end for the task tracker: a layout with a shared header, list view with priority badges and a completion checkbox (form post + PRG), a create form with tag-helper validation and a validation summary, and delete with anti-forgery. Add an <code>OrderRow</code>-style ViewModel for the list. Extract the priority badge into a <strong>partial</strong>, then into a <strong>view component</strong> that shows completion stats &mdash; feel which one deserves logic. Then add one minimal API endpoint alongside &mdash; both styles coexist in a single app. Break <code>ModelState.IsValid</code> deliberately (remove the return) and watch what posts through.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Controller coordinates; Model carries; View renders &mdash; binding comes from route/query/form/header/body.</li>
  <li>Razor: layouts via <code>RenderBody</code>/sections, partials for pure markup, view components for logic+markup.</li>
  <li>ViewModels per screen block over-posting and keep entities out of the UI.</li>
  <li><code>ModelState.IsValid</code> &rarr; redisplay, then Post-Redirect-Get with TempData; anti-forgery on every form.</li>
  <li>Filters are MVC&rsquo;s per-action middleware; minimal APIs use endpoint filters instead.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Create a custom tag helper <code>&lt;priority-badge&gt;</code> rendering colored HTML from an attribute.</li><li>Add a view component that renders the top-3 oldest open tasks &mdash; inject the repo via DI.</li><li>Make the create form re-render preserving user input after invalid POST (inspect ModelState).</li></ul>
`,
  quiz: [
    {
      "q": "Tag helpers like asp-for give you…",
      "a": [
        "Client-side caching",
        "Compile-time-checked URLs/fields bound to your model",
        "CSS generation",
        "Minification"
      ],
      "correct": 1,
      "expl": "Rename a property and the compiler shows every affected view."
    },
    {
      "q": "Post-Redirect-Get exists to…",
      "a": [
        "Speed up posts",
        "Prevent double-submit on refresh after POST",
        "Cache forms",
        "Log traffic"
      ],
      "correct": 1,
      "expl": "Redirect after POST turns refresh into a harmless GET."
    },
    {
      "q": "View components differ from partials because they…",
      "a": [
        "Are faster",
        "Have their own logic + DI, like mini-controllers",
        "Need no model",
        "Are client-side"
      ],
      "correct": 1,
      "expl": "Use for carts, panels, anything with logic + markup."
    },
    {
      "q": "ViewModels exist to…",
      "a": [
        "Reduce file count",
        "Shape data per screen and block over-posting",
        "Replace entities",
        "Avoid Razor"
      ],
      "correct": 1,
      "expl": "Screens get exactly their data; attackers cannot post undeclared fields."
    }
  ]

};