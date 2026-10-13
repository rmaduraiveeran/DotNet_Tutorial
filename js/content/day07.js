/* Day 7: Week 1 Project — CLI Task Tracker */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[7] = {
  html: `
<p>Project day. You will build a JSON-backed command-line task tracker using everything from Days 1&ndash;6: types, LINQ, records, collections, and file I/O. Budget about 90 minutes.</p>

<h2>What you are building</h2>
<div class="codeblock"><div class="codeblock-header">terminal &mdash; target behavior</div><pre><code>&gt; dotnet run -- add "Finish tutorial day 7" --priority high
Added #1: Finish tutorial day 7 [high]

&gt; dotnet run -- list
ID  Priority  Done  Title
1   high      [ ]   Finish tutorial day 7

&gt; dotnet run -- done 1
Completed #1</code></pre></div>

<h2>Step 1 &mdash; model the data (records)</h2>
<div class="codeblock"><div class="codeblock-header">TaskItem.cs</div><pre><code>public enum Priority { Low, Medium, High }

public record TaskItem(
    int Id,
    string Title,
    Priority Priority,
    bool IsDone,
    DateOnly CreatedOn
);</code></pre></div>

<h2>Step 2 &mdash; persistence (System.Text.Json)</h2>
<div class="codeblock"><div class="codeblock-header">TaskStore.cs</div><pre><code>using System.Text.Json;

public class TaskStore(string filePath)
{
    private static readonly JsonSerializerOptions s_options =
        new() { WriteIndented = true };

    private List&lt;TaskItem&gt; _tasks = [];

    public void Load()
    {
        if (!File.Exists(filePath)) { _tasks = []; return; }
        var json = File.ReadAllText(filePath);
        _tasks = JsonSerializer.Deserialize&lt;List&lt;TaskItem&gt;&gt;(json) ?? [];
    }

    public void Save() =&gt;
        File.WriteAllText(filePath, JsonSerializer.Serialize(_tasks, s_options));

    public IReadOnlyList&lt;TaskItem&gt; All =&gt; _tasks;

    public TaskItem Add(string title, Priority priority)
    {
        var task = new TaskItem(
            Id: _tasks.Count == 0 ? 1 : _tasks.Max(t =&gt; t.Id) + 1,
            Title: title,
            Priority: priority,
            IsDone: false,
            CreatedOn: DateOnly.FromDateTime(DateTime.UtcNow));
        _tasks.Add(task);
        Save();
        return task;
    }

    public bool Complete(int id)
    {
        var idx = _tasks.FindIndex(t =&gt; t.Id == id);
        if (idx &lt; 0) return false;
        _tasks[idx] = _tasks[idx] with { IsDone = true };   // record &rarr; with!
        Save();
        return true;
    }
}</code></pre></div>

<h2>Step 3 &mdash; the command loop</h2>
<div class="codeblock"><div class="codeblock-header">Program.cs</div><pre><code>var store = new TaskStore("tasks.json");
store.Load();

var command = args.Length &gt; 0 ? args[0].ToLowerInvariant() : "list";

switch (command)
{
    case "add":
        var title = args.Length &gt; 1 ? args[1] : throw new ArgumentException("Title required");
        var pIndex = Array.IndexOf(args, "--priority");
        var priority = pIndex &gt;= 0 &amp;&amp; args.Length &gt; pIndex + 1
            ? Enum.Parse&lt;Priority&gt;(args[pIndex + 1], ignoreCase: true)
            : Priority.Medium;
        var added = store.Add(title, priority);
        Console.WriteLine($"Added #{added.Id}: {added.Title} [{added.Priority}]");
        break;

    case "done":
        Console.WriteLine(store.Complete(int.Parse(args[1]))
            ? $"Completed #{args[1]}"
            : $"No task #{args[1]}");
        break;

    default:  // list &mdash; LINQ from Day 6
        var rows = store.All
            .OrderBy(t =&gt; t.IsDone)                    // open tasks first
            .ThenByDescending(t =&gt; t.Priority)
            .Select(t =&gt; $"{t.Id,-3} {t.Priority,-9} {(t.IsDone ? "[x]" : "[ ]")} {t.Title}");
        foreach (var row in rows) Console.WriteLine(row);
        break;
}</code></pre></div>

<h2>Architecture check</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 760 120" width="760" height="120" role="img" aria-label="App structure">
  <defs><marker id="d7a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="35" width="200" height="50" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/><text x="120" y="56" text-anchor="middle" class="dg-text">Program.cs</text><text x="120" y="72" text-anchor="middle" class="dg-sub">parse args &middot; render output</text>
  <rect x="280" y="35" width="200" height="50" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="380" y="56" text-anchor="middle" class="dg-text">TaskStore</text><text x="380" y="72" text-anchor="middle" class="dg-sub">rules &middot; Add/Complete</text>
  <rect x="540" y="35" width="200" height="50" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/><text x="640" y="56" text-anchor="middle" class="dg-text">tasks.json</text><text x="640" y="72" text-anchor="middle" class="dg-sub">persistence</text>
  <line x1="220" y1="60" x2="278" y2="60" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d7a)"/>
  <line x1="480" y1="60" x2="538" y2="60" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d7a)"/>
</svg>
</div>
<div class="callout tip"><div class="co-title">Why this split matters</div><p>UI (Program), business rules (TaskStore), and storage (JSON file) are separate. On Day 13 you will unit-test <code>TaskStore</code> without a console, and on Day 12 you already have the serialization pattern down. Same layering scales to the web apps of Weeks 3&ndash;4.</p></div>

<h2>Stretch goals</h2>
<ul>
  <li>Add <code>--tag</code> support and a <code>tag &lt;tag&gt;</code> filter command (hint: <code>HashSet&lt;string&gt;</code>).</li>
  <li>Add <code>stats</code>: completion percentage by priority using <code>GroupBy</code>.</li>
  <li>Corrupt the JSON file on purpose and make <code>Load()</code> survive it gracefully.</li>
</ul>

<h2>Key takeaways</h2>
<ul>
  <li>Records + <code>with</code> make state transitions clean and immutable-friendly.</li>
  <li>Separate UI, logic, and persistence from the first line of code.</li>
  <li>JSON persistence is ~15 lines with System.Text.Json.</li>
  <li>LINQ turns report generation into one readable pipeline.</li>
</ul>
`
};
