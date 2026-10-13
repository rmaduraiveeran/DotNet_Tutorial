/* Day 6: LINQ & Functional C# */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[6] = {
  html: `
<p>LINQ (Language-INtegrated Query) is the single most important idea in day-to-day C#: you describe <em>what</em> you want from any collection, and the provider figures out <em>how</em>.</p>

<h2>The mental model</h2>
<p>Every LINQ method is an extension method on <code>IEnumerable&lt;T&gt;</code>. They chain because each returns a new sequence &mdash; nothing runs until you enumerate (deferred execution).</p>
<div class="diagram-wrap">
<svg viewBox="0 0 820 130" width="820" height="130" role="img" aria-label="LINQ pipeline">
  <defs><marker id="d6a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="15" y="40" width="130" height="44" rx="8" fill="#f1f3f5" stroke="#8a919e"/><text x="80" y="60" text-anchor="middle" class="dg-text">Source</text><text x="80" y="76" text-anchor="middle" class="dg-sub">List&lt;T&gt;, array, DB</text>
  <rect x="185" y="40" width="130" height="44" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="250" y="60" text-anchor="middle" class="dg-text">Where</text><text x="250" y="76" text-anchor="middle" class="dg-sub">filter</text>
  <rect x="355" y="40" width="130" height="44" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="420" y="60" text-anchor="middle" class="dg-text">Select</text><text x="420" y="76" text-anchor="middle" class="dg-sub">transform</text>
  <rect x="525" y="40" width="130" height="44" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="590" y="60" text-anchor="middle" class="dg-text">OrderBy</text><text x="590" y="76" text-anchor="middle" class="dg-sub">sort</text>
  <rect x="695" y="40" width="110" height="44" rx="8" fill="#e7f8f1" stroke="#0e9f6e"/><text x="750" y="60" text-anchor="middle" class="dg-text">ToList</text><text x="750" y="76" text-anchor="middle" class="dg-sub">materialize</text>
  <line x1="145" y1="62" x2="183" y2="62" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d6a)"/>
  <line x1="315" y1="62" x2="353" y2="62" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d6a)"/>
  <line x1="485" y1="62" x2="523" y2="62" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d6a)"/>
  <line x1="655" y1="62" x2="693" y2="62" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d6a)"/>
</svg>
</div>

<h2>The operators that cover 90% of daily work</h2>
<div class="codeblock"><div class="codeblock-header">Linq.cs</div><pre><code>record Product(string Name, string Category, decimal Price);

List&lt;Product&gt; products =
[
    new("Laptop",  "Electronics", 1200m),
    new("Mouse",   "Electronics", 25m),
    new("Desk",    "Furniture",   300m),
    new("Chair",   "Furniture",   120m),
];

// Where: filter        &mdash; lazy, nothing executed yet
var cheap = products.Where(p =&gt; p.Price &lt; 200m);

// Select: project into something else
var names = products.Select(p =&gt; p.Name);

// Chained pipeline + materialization:
var electronics = products
    .Where(p =&gt; p.Category == "Electronics")
    .OrderByDescending(p =&gt; p.Price)
    .Select(p =&gt; $"{p.Name}: {p.Price:C}")
    .ToList();                       // enumerates the whole chain ONCE, here

// Aggregation
var count   = products.Count(p =&gt; p.Price &gt; 100m);
var total   = products.Sum(p =&gt; p.Price);
var priciest = products.MaxBy(p =&gt; p.Price);
var anyExpensive = products.Any(p =&gt; p.Price &gt; 1000m);   // short-circuits

// GroupBy + projection
var byCategory = products.GroupBy(p =&gt; p.Category)
    .Select(g =&gt; new { Category = g.Key, Total = g.Sum(p =&gt; p.Price), Items = g.Count() });

// First vs FirstOrDefault &mdash; the #1 runtime crash source:
var m = products.FirstOrDefault(p =&gt; p.Name == "Nope");  // null, not an exception</code></pre></div>

<h2>Query syntax vs method syntax</h2>
<div class="codeblock"><div class="codeblock-header">Two spellings of the same query</div><pre><code>var methodSyntax = products.Where(p =&gt; p.Price &lt; 100m).Select(p =&gt; p.Name);

var querySyntax = from p in products
                  where p.Price &lt; 100m
                  select p.Name;

// Identical output. Method syntax is more common in modern code because
// it exposes operators (GroupBy joins, Count, MaxBy) that query syntax lacks.</code></pre></div>

<h2>Deferred execution: the bug that gets everyone</h2>
<div class="codeblock"><div class="codeblock-header">Pitfall.cs</div><pre><code>var numbers = new List&lt;int&gt; { 1, 2, 3 };
var query = numbers.Where(n =&gt; n &gt; 1);   // NOT executed yet &mdash; just a recipe

numbers.Add(99);                          // the recipe sees this!
Console.WriteLine(query.Count());         // 3, not 2

// Rule: LINQ queries are live views. Call ToList()/ToArray() when you need a snapshot.</code></pre></div>
<div class="callout warning"><div class="co-title">Two classic LINQ bugs</div><p>(1) <strong>Multiple enumeration</strong> &mdash; a stored <code>IEnumerable</code> re-runs the whole query on every <code>foreach</code>; materialize once. (2) <strong>Consuming the DB query twice</strong> &mdash; with EF Core, same story, plus an extra round-trip.</p></div>

<h2>LINQ to Objects vs LINQ to Entities</h2>
<p>The same operators work over lists (in memory) and over databases (via EF Core, translated to SQL on Day 17). That is the platform superpower: learn the query API once, use it everywhere. But mind the difference &mdash; over a database, only what fits SQL can be translated, and <code>AsEnumerable()</code> marks the boundary where rows enter memory.</p>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (30 min)</div>
<p>Given a <code>List&lt;Order&gt;</code> (record with <code>Id</code>, <code>Customer</code>, <code>Items: List&lt;(string Product, decimal Price)&gt;</code>, <code>Date</code>): compute (1) revenue per customer sorted descending, (2) the top product by units sold, (3) customers with orders in the last 7 days only. Chain Where/SelectMany/GroupBy/Orderby &mdash; no imperative loops allowed.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>LINQ = composable, lazy pipelines over any sequence.</li>
  <li><code>Where</code> filters, <code>Select</code> projects, <code>GroupBy</code> buckets, <code>Aggregate</code> folds.</li>
  <li>Deferred execution means queries are live; snapshot with <code>ToList()</code>.</li>
  <li>Same syntax over lists today, databases on Day 17.</li>
</ul>
`
};
