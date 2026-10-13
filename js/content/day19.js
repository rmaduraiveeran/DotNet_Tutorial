/* Day 19: Blazor & Component UI */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[19] = {
  html: `
<p>Blazor lets you build interactive web UIs in C# instead of JavaScript. Components are .razor files &mdash; HTML plus typed logic in one place.</p>

<h2>Hosting models: where the code runs</h2>
<div class="table-wrap"><table>
<thead><tr><th>Model</th><th>C# runs&hellip;</th><th>Latency</th><th>Offline?</th></tr></thead>
<tbody>
<tr><td><strong>Interactive Server</strong></td><td>on the server; UI events over SignalR socket</td><td>fast round-trips, needs connection</td><td>no</td></tr>
<tr><td><strong>WebAssembly</strong></td><td>in the browser (real .NET runtime, WASM)</td><td>load once, then instant</td><td>yes</td></tr>
<tr><td><strong>Auto</strong> (.NET 8+)</td><td>server first, WASM after download</td><td>best of both</td><td>after load</td></tr>
<tr><td><strong>Static SSR</strong></td><td>server, render once, no interactivity</td><td>fastest</td><td>n/a</td></tr>
</tbody></table></div>

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
<div class="codeblock"><div class="codeblock-header">Components.cshtml patterns</div><pre><code>&lt;!-- Parent.razor --&gt;
&lt;TaskRow Task="@task" OnComplete="MarkDone" /&gt;

@code {
    private void MarkDone(TaskItem t) =&gt; /* ... */;
}

// TaskRow.razor
[Parameter] public TaskItem Task { get; set; } = null!;
[Parameter] public EventCallback&lt;TaskItem&gt; OnComplete { get; set; }

&lt;button @onclick="() =&gt; OnComplete.InvokeAsync(Task)"&gt;Done&lt;/button&gt;</code></pre></div>
<div class="diagram-wrap">
<svg viewBox="0 0 820 150" width="820" height="150" role="img" aria-label="Blazor component tree and render flow">
  <defs><marker id="d19a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="300" y="15" width="220" height="42" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.4"/><text x="410" y="41" text-anchor="middle" class="dg-text">App.razor</text>
  <rect x="170" y="85" width="200" height="40" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="270" y="110" text-anchor="middle" class="dg-sub">TaskList.razor</text>
  <rect x="450" y="85" width="200" height="40" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="550" y="110" text-anchor="middle" class="dg-sub">TaskRow.razor &times; N</text>
  <line x1="380" y1="57" x2="290" y2="83" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d19a)"/>
  <line x1="440" y1="57" x2="530" y2="83" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d19a)"/>
  <text x="410" y="140" text-anchor="middle" class="dg-sub">events bubble up via EventCallback &middot; data flows down via [Parameter]</text>
</svg>
</div>

<h2>When Blazor, when JS framework</h2>
<ul>
  <li><strong>Blazor</strong>: team knows C#, internal tools, dashboards, full-stack C# apps, reuse of domain libs in browser.</li>
  <li><strong>JS frameworks</strong>: massive JS ecosystems, existing team skills, public-facing marketing sites with heavy custom animation.</li>
  <li>Both can share one ASP.NET Core backend &mdash; and you can mix static SSR pages with Blazor islands per component (that is the .NET 8 model).</li>
</ul>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (45 min)</div>
<p>Build a Blazor UI over your task API: a list component with add/complete/remove, a filter dropdown (all/open/done) via a cascading parameter, and a <code>TaskRow</code> child component with an EventCallback. Watch the Network tab &mdash; notice there is no JS bundle, just a socket (Server) or WASM payload (WebAssembly).</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Components = HTML + C#; .razor files compile to render-tree code.</li>
  <li>Data down via [Parameter], events up via EventCallback.</li>
  <li>Choose render mode per component in .NET 8+ (server/WASM/auto/static).</li>
  <li>Lifecycle hooks are where data loads and JS interop happens.</li>
</ul>
`
};
