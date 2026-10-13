/* Day 19: Blazor & Component UI */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[19] = {
  html: `
<p>Blazor lets you build interactive web UIs in C# instead of JavaScript. Components are .razor files &mdash; HTML plus typed logic in one place.</p>

<h2>Hosting models: where the code runs</h2>
<p>The same component code runs in all models &mdash; the difference is <em>where C# executes and how UI events travel</em>. This table is the single most important decision in any Blazor project.</p>
<div class="table-wrap"><table>
<thead><tr><th>Model</th><th>C# runs&hellip;</th><th>Latency</th><th>Offline?</th><th>Watch out</th></tr></thead>
<tbody>
<tr><td><strong>Interactive Server</strong></td><td>on the server; UI events + render diffs over a SignalR socket (&ldquo;circuit&rdquo;)</td><td>fast round-trips, needs connection</td><td>no</td><td>every keystroke = server round-trip; scale = connections</td></tr>
<tr><td><strong>WebAssembly</strong></td><td>in the browser (real .NET runtime compiled to WASM)</td><td>load once (~few MB), then instant</td><td>yes (PWA)</td><td>initial download; all code ships to client</td></tr>
<tr><td><strong>Auto</strong> (.NET 8+)</td><td>server first, WASM after runtime downloads</td><td>best of both</td><td>after load</td><td>two runtimes to keep compatible</td></tr>
<tr><td><strong>Static SSR</strong></td><td>server, render once, no interactivity</td><td>fastest TTFB</td><td>n/a</td><td>no events/bindings without interactivity</td></tr>
</tbody></table></div>
<div class="codeblock"><div class="codeblock-header">Render modes in practice (.NET 8+ &mdash; per page/组件, not per app)</div><pre><code>@* Routes.razor / App.razor sets the default; components override: *@
&lt;Routes @rendermode="InteractiveServer" /&gt;      @* whole app, server interactive *@

@* Home.razor &mdash; static by default (great SEO, zero WebSocket): *@
&lt;h1&gt;Welcome&lt;/h1&gt;

@* Dashboard.razor &mdash; THIS component is interactive, page still static: *@
@rendermode InteractiveServer

@* Reports.razor &mdash; heavy client logic, WASM after first load: *@
@rendermode InteractiveAuto

@* Global interactivity + streaming SSR for slow data: *@
&lt;ArticlePage /&gt;   @* &lt;StreamRendering /&gt; attribute streams HTML as it resolves *@</code></pre></div>

<h2>A component, dissected</h2>
<div class="codeblock"><div class="codeblock-header">TaskList.razor &mdash; component</div><pre><code>@using System.Net.Http.Json
@inject HttpClient Http
@rendermode InteractiveServer          &lt;!-- .NET 8 per-component render mode --&gt;

&lt;h3&gt;My tasks (@Tasks.Count)&lt;/h3&gt;

&lt;input @bind="newTitle" placeholder="What needs doing?" /&gt;
&lt;button @onclick="AddTask"&gt;Add&lt;/button&gt;

&lt;ul&gt;
    @foreach (var task in Tasks)
    {
        &lt;li class="@GetClass(task)"&gt;
            &lt;input type="checkbox" @bind="task.IsDone" /&gt;
            @task.Title
            &lt;button @onclick="() =&gt; Remove(task)"&gt;&amp;times;&lt;/button&gt;
        &lt;/li&gt;
    }
&lt;/ul&gt;

@code {
    private List&lt;TaskItem&gt; Tasks = [];
    private string newTitle = "";

    protected override async Task OnInitializedAsync() =&gt;
        Tasks = await Http.GetFromJsonAsync&lt;List&lt;TaskItem&gt;&gt;("api/tasks") ?? [];

    private async Task AddTask()
    {
        if (string.IsNullOrWhiteSpace(newTitle)) return;
        var created = await Http.PostAsJsonAsync&lt;TaskItem&gt;("api/tasks",
            new TaskItem(0, newTitle, Priority.Medium, false, DateOnly.FromDateTime(DateTime.UtcNow)));
        newTitle = "";
        Tasks = await Http.GetFromJsonAsync&lt;List&lt;TaskItem&gt;&gt;("api/tasks") ?? [];
    }

    private void Remove(TaskItem t) =&gt; Tasks.Remove(t);
    private static string GetClass(TaskItem t) =&gt; t.IsDone ? "done" : "";
}</code></pre></div>
<div class="callout note"><div class="co-title">The component lifecycle</div><p><code>OnInitialized(Async)</code> &rarr; <code>OnParametersSet</code> &rarr; render &rarr; <code>OnAfterRender(Async)</code> for DOM/JS interop. State changes call <code>StateHasChanged()</code> implicitly after events; explicitly when a timer or socket updates data.</p></div>

<h2>Parameters, binding, and events</h2>
<div class="codeblock"><div class="codeblock-header">Component patterns &mdash; data down, events up</div><pre><code>&lt;!-- Parent.razor --&gt;
&lt;TaskRow Task="@task" OnComplete="MarkDone" /&gt;

@code {
    private void MarkDone(TaskItem t) =&gt; /* ... */;
}

// TaskRow.razor
[Parameter] public TaskItem Task { get; set; } = null!;
[Parameter] public EventCallback&lt;TaskItem&gt; OnComplete { get; set; }

&lt;button @onclick="() =&gt; OnComplete.InvokeAsync(Task)"&gt;Done&lt;/button&gt;</code></pre></div>
<div class="codeblock"><div class="codeblock-header">Cascading values &amp; two-way binding</div><pre><code>&lt;!-- Grandparent provides context to ALL descendants without prop-drilling: --&gt;
&lt;CascadingValue Value="currentTheme" IsFixed="true"&gt;
    &lt;Router ... /&gt;
&lt;/CascadingValue&gt;

@* Any descendant: *@
[CascadingParameter] private ThemeInfo Theme { get; set; } = null!;

@* Two-way binding sugar: @bind="x" is @value="x" + @valueChanged="v =&gt; x = v" *@
&lt;input @bind="filter" @bind:after="ApplyFilter" /&gt;   @* .after fires on blur; .oninput per keystroke *@
&lt;select @bind="statusFilter"&gt;
    &lt;option value="all"&gt;All&lt;/option&gt;
    &lt;option value="open"&gt;Open&lt;/option&gt;
&lt;/select&gt;</code></pre></div>
<div class="diagram-wrap">
<svg viewBox="0 0 820 150" width="820" height="150" role="img" aria-label="Blazor component tree and render flow">
  <defs><marker id="d19a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="300" y="15" width="220" height="42" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.4"/><text x="410" y="41" text-anchor="middle" class="dg-text">App.razor</text>
  <rect x="170" y="85" width="200" height="40" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="270" y="110" text-anchor="middle" class="dg-sub">TaskList.razor</text>
  <rect x="450" y="85" width="200" height="40" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="550" y="110" text-anchor="middle" class="dg-sub">TaskRow.razor &times; N</text>
  <line x1="380" y1="57" x2="290" y2="83" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d19a)"/>
  <line x1="440" y1="57" x2="530" y2="83" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d19a)"/>
  <text x="410" y="140" text-anchor="middle" class="dg-sub">events bubble up via EventCallback &middot; data flows down via [Parameter] &middot; context via CascadingValue</text>
</svg>
</div>

<h2>Routing, navigation, and layout</h2>
<div class="codeblock"><div class="codeblock-header">Routing.razor patterns</div><pre><code>@page "/tasks/{Id:int}"                  @* route + typed parameter *@
@page "/tasks"                           @* multiple routes per component *@
@attribute [Authorize]                    @* wired to ASP.NET Core auth (Day 20) *@

@* Navigation: NavMenu with active-state highlighting: *@
&lt;NavLink href="tasks" ActiveClass="active"&gt;Tasks&lt;/NavLink&gt;

@code {
    [Inject] private NavigationManager Nav { get; set; } = null!;

    private void GoToTask(int id) =&gt; Nav.NavigateTo($"/tasks/{id}");
    // Nav.Uri / Nav.LocationChanged &mdash; react to URL changes
}</code></pre></div>

<h2>Forms: EditForm + validation without JS</h2>
<div class="codeblock"><div class="codeblock-header">TaskForm.razor &mdash; the whole pattern</div><pre><code>&lt;EditForm Model="model" OnValidSubmit="Save"&gt;
    &lt;DataAnnotationsValidator /&gt;          @* or a FluentValidation validator component *@
    &lt;ValidationSummary /&gt;
    &lt;InputText @bind-Value="model.Title" /&gt;
    &lt;InputSelect @bind-Value="model.Priority"&gt;
        &lt;option value="Low"&gt;Low&lt;/option&gt;&lt;option value="High"&gt;High&lt;/option&gt;
    &lt;/InputSelect&gt;
    &lt;InputCheckbox @bind-Value="model.IsUrgent" /&gt;
    &lt;button type="submit"&gt;Save&lt;/button&gt;
&lt;/EditForm&gt;

@code {
    private TaskFormModel model = new();     // InputX components edit nested models too

    public class TaskFormModel
    {
        [Required, StringLength(100)] public string Title { get; set; } = "";
        public string Priority { get; set; } = "Low";
        public bool IsUrgent { get; set; }
    }

    private async Task Save()
    {
        await Http.PostAsJsonAsync("api/tasks", model);   // model was already validated
    }
}</code></pre></div>

<h2>JavaScript interop: the bridge when you need it</h2>
<div class="codeblock"><div class="codeblock-header">Interop.cs &mdash; calling JS from C# and back</div><pre><code>public class ChartInterop(IJSRuntime js)
{
    public async ValueTask DrawChart(string id, int[] data) =&gt;
        await js.InvokeVoidAsync("myLib.drawChart", id, data);   // window.myLib.drawChart

    public async ValueTask&lt;decimal&gt; GetZoomAsync() =&gt;
        await js.InvokeAsync&lt;decimal&gt;("myLib.getZoom");
}

// C# &rarr; JS callable from .NET (for JS libraries to call YOU):
[JSInvokable]
public Task OnResize(int w, int h) =&gt; Recalculate(w, h);

// IJSObjectReference &mdash; hold a JS object and call methods on it (like a JS import);
// JS &rarr; C# via DotNetObjectReference.Create(this) + dotnetRef.invokeMethodAsync(...)
// Always guard: IJSRuntime is NOT available during prerendering (static SSR).</code></pre></div>

<h2>Circuits, state, and the server model's gotchas</h2>
<ul>
  <li><strong>Circuit</strong> = one user's live connection: component trees + DI scope + SignalR channel. It survives reconnects briefly, then dies &mdash; scoped services die with it.</li>
  <li><strong>Inject scoped services freely</strong>, but anything you want to survive across circuits must be persisted (DB, distributed cache) &mdash; there is no &ldquo;session&rdquo; by default.</li>
  <li><strong>Prerendering</strong>: components render once on the server (static HTML, no socket) then again when interactivity connects. Guard with <code>OnAfterRenderAsync</code> or <code>persisted component state</code> to avoid double data-fetching.</li>
  <li><strong>Server-side scalability</strong>: each circuit holds memory; thousands of users &rarr; WASM or <code>InteractiveAuto</code>. Azure SignalR Service offloads sockets when scaling out.</li>
  <li><strong>Memory leaks classic</strong>: event handlers on static events, timers not disposed &mdash; implement <code>IDisposable</code> on components that subscribe.</li>
</ul>
<div class="diagram-wrap">
<svg viewBox="0 0 820 130" width="820" height="130" role="img" aria-label="Blazor Server circuit anatomy">
  <defs><marker id="d19b" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="35" width="170" height="56" rx="8" fill="#f1f3f5" stroke="#8a919e"/><text x="105" y="58" text-anchor="middle" class="dg-text">Browser</text><text x="105" y="76" text-anchor="middle" class="dg-sub">DOM + event capture</text>
  <rect x="250" y="35" width="170" height="56" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="335" y="58" text-anchor="middle" class="dg-text">SignalR socket</text><text x="335" y="76" text-anchor="middle" class="dg-sub">events &rarr; render diffs &larr;</text>
  <rect x="480" y="35" width="310" height="56" rx="8" fill="#e7f8f1" stroke="#0e9f6e"/><text x="635" y="58" text-anchor="middle" class="dg-text">Circuit on server</text><text x="635" y="76" text-anchor="middle" class="dg-sub">component tree &middot; DI scope &middot; your C#</text>
  <line x1="190" y1="63" x2="248" y2="63" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d19b)"/>
  <line x1="420" y1="63" x2="478" y2="63" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d19b)"/>
  <text x="410" y="115" text-anchor="middle" class="dg-sub">click &rarr; socket &rarr; C# handler &rarr; StateHasChanged &rarr; diff &rarr; socket &rarr; DOM patch &mdash; no JS framework involved</text>
</svg>
</div>

<h2>Component testing without a browser</h2>
<div class="codeblock"><div class="codeblock-header">bUnit &mdash; components as testable units</div><pre><code>// dotnet add package bunit
[Fact]
public void TaskList_RendersRows_AndRaisesComplete()
{
    using var ctx = new BunitContext();
    ctx.Services.AddSingleton(mockTaskApi.Object);

    var cut = ctx.Render&lt;TaskList&gt;();            // cut = component under test
    cut.Markup.Should().Contain("Finish tutorial");

    cut.Find("button.add").Click();              // simulate interactions
    cut.Find("input[type=checkbox]").Change(true);
    // assert EventCallback fired / markup updated &mdash; no browser, milliseconds
}</code></pre></div>

<h2>When Blazor, when JS framework</h2>
<ul>
  <li><strong>Blazor</strong>: team knows C#, internal tools, dashboards, full-stack C# apps, reuse of domain libs in browser.</li>
  <li><strong>JS frameworks</strong>: massive JS ecosystems, existing team skills, public-facing marketing sites with heavy custom animation.</li>
  <li>Both can share one ASP.NET Core backend &mdash; and .NET 8+ lets you mix static SSR pages with Blazor islands <em>per component</em>, which is exactly how real production apps adopt it incrementally.</li>
</ul>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (45 min)</div>
<p>Build a Blazor UI over your task API: a list component with add/complete/remove using <code>EditForm</code> + <code>DataAnnotationsValidator</code>, a filter dropdown wired through a <code>CascadingValue</code>, and a <code>TaskRow</code> child component with an <code>EventCallback</code>. Set the page to <code>InteractiveServer</code>, then switch it to <code>InteractiveAuto</code> and watch the WASM runtime download. Add a <code>NavLink</code> menu with active styling. Write one bUnit test asserting the empty-state message. Finally inspect DevTools: there is no JS bundle of yours &mdash; just a socket (Server) or WASM payload (WebAssembly).</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Components = HTML + C#; .razor files compile to render-tree code.</li>
  <li>Data down via <code>[Parameter]</code>/<code>CascadingValue</code>, events up via <code>EventCallback</code>.</li>
  <li>Render modes are per-component in .NET 8+ (static/server/WASM/auto) &mdash; adopt incrementally.</li>
  <li>Server interactivity = circuits (memory per user, socket latency); WASM = download cost, instant after.</li>
  <li>Forms via EditForm validate without JS; JS interop exists for when you truly need it.</li>
  <li>bUnit makes components unit-testable like everything else in C#.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Add <code>&lt;Virtualize&gt;</code> to the list and test with 10,000 rows &mdash; DOM stays small.</li><li>Implement a <code>Timer</code>-driven auto-refresh guarded by <code>StateHasChanged</code> + <code>IDisposable</code>.</li><li>Swap a component to <code>InteractiveWebAssembly</code> and compare Network tab payloads.</li></ul>
`,
  quiz: [
    {
      "q": "Blazor Server interactivity means…",
      "a": [
        "JS in the browser",
        "C# on the server, UI events over a SignalR circuit",
        "Static HTML",
        "WebSockets only"
      ],
      "correct": 1,
      "expl": "The circuit carries events in and render diffs out."
    },
    {
      "q": "InteractiveAuto mode…",
      "a": [
        "Picks static always",
        "Serves Server first, downloads WASM, then switches",
        "Requires .NET 9",
        "Is deprecated"
      ],
      "correct": 1,
      "expl": "Fast first paint + WASM performance after load."
    },
    {
      "q": "Data flows ___ and events flow ___ in Blazor components.",
      "a": [
        "up / down",
        "down / up",
        "sideways / nowhere",
        "Both down"
      ],
      "correct": 1,
      "expl": "[Parameter]s down, EventCallbacks up — the unidirectional contract."
    },
    {
      "q": "EditForm + DataAnnotationsValidator…",
      "a": [
        "Require JavaScript",
        "Validate client- and server-side from the same attributes",
        "Only work on WASM",
        "Replace models"
      ],
      "correct": 1,
      "expl": "Same rules as your API models — one validation contract."
    }
  ]

};