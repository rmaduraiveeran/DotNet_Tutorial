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
<div class="codeblock"><div class="codeblock-header">OrdersController.cs</div><pre><code>public class OrdersController(IOrderRepository repo) : Controller
{
    // GET /orders &mdash; list view
    public async Task&lt;IActionResult&gt; Index(int page = 1)
    {
        var model = new OrderListViewModel
        {
            Orders = await repo.GetPagedAsync(page, 20),
            CurrentPage = page
        };
        return View(model);                 // renders Views/Orders/Index.cshtml
    }

    // POST /orders/7/delete &mdash; form post with anti-forgery check
    [HttpPost, ValidateAntiForgeryToken]
    public async Task&lt;IActionResult&gt; Delete(int id)
    {
        await repo.DeleteAsync(id);
        TempData["Status"] = "Order deleted.";
        return RedirectToAction(nameof(Index));     // Post-Redirect-Get pattern
    }
}</code></pre></div>
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

<h2>ViewModels: the professional habit</h2>
<p>Never hand your entity classes to views. A ViewModel contains exactly what the screen needs: display strings, page numbers, select lists. Your domain model stays free of UI concerns, and a malicious user cannot post fields you never displayed.</p>

<h2>MVC vs minimal APIs vs Blazor</h2>
<div class="table-wrap"><table>
<thead><tr><th></th><th>Minimal APIs</th><th>MVC</th><th>Blazor</th></tr></thead>
<tbody>
<tr><td>Best for</td><td>JSON APIs</td><td>Server-rendered sites</td><td>Rich interactive UIs</td></tr>
<tr><td>Client JS</td><td>n/a</td><td>A little (forms, modest JS)</td><td>C# instead of JS</td></tr>
<tr><td>Structure</td><td>Endpoint functions</td><td>Controllers/Views folders</td><td>Components (.razor)</td></tr>
<tr><td>Learning order</td><td>Day 15</td><td>Day 18</td><td>Day 19</td></tr>
</tbody></table></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (40 min)</div>
<p>Build an MVC front-end for the task tracker: list view with priority badges and a completion checkbox (form post), a create form with validation summary, and delete with anti-forgery. Add a ViewModel for the list. Then add one minimal API endpoint alongside &mdash; both styles can coexist in a single app.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Controller coordinates; Model carries; View renders.</li>
  <li>Razor is HTML with typed C# via @ and tag helpers.</li>
  <li>ViewModels per screen protect both domain and users.</li>
  <li>Post-Redirect-Get and anti-forgery tokens for every form.</li>
</ul>
`
};
