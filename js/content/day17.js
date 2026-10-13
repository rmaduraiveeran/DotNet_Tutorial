/* Day 17: Entity Framework Core */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[17] = {
  html: `
<p>EF Core maps C# objects to database rows. You write LINQ; it writes SQL. Today: models, DbContext, migrations, and the performance traps that matter in production.</p>

<h2>The object-relational map</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 160" width="820" height="160" role="img" aria-label="EF Core mapping">
  <defs><marker id="d17a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="30" y="40" width="220" height="80" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="140" y="62" text-anchor="middle" class="dg-text">Your C# objects</text>
  <text x="140" y="82" text-anchor="middle" class="dg-sub">Order, Customer (records)</text>
  <text x="140" y="98" text-anchor="middle" class="dg-sub">List&lt;Order&gt; navigation</text>
  <rect x="340" y="40" width="150" height="80" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/>
  <text x="415" y="70" text-anchor="middle" class="dg-text">EF Core</text>
  <text x="415" y="90" text-anchor="middle" class="dg-sub">LINQ &rarr; SQL</text>
  <rect x="570" y="40" width="220" height="80" rx="10" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/>
  <text x="680" y="62" text-anchor="middle" class="dg-text">Database</text>
  <text x="680" y="82" text-anchor="middle" class="dg-sub">Orders, Customers tables</text>
  <text x="680" y="98" text-anchor="middle" class="dg-sub">FK + indexes</text>
  <line x1="250" y1="80" x2="338" y2="80" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d17a)"/>
  <line x1="490" y1="80" x2="568" y2="80" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d17a)"/>
</svg>
</div>

<h2>Model + DbContext</h2>
<div class="codeblock"><div class="codeblock-header">ShopContext.cs</div><pre><code>public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List&lt;Order&gt; Orders { get; set; } = [];     // navigation property
}

public class Order
{
    public int Id { get; set; }
    public decimal Total { get; set; }
    public DateTime CreatedUtc { get; set; }
    public int CustomerId { get; set; }               // FK
    public Customer? Customer { get; set; }           // navigation
}

public class ShopContext : DbContext
{
    public DbSet&lt;Customer&gt; Customers =&gt; Set&lt;Customer&gt;();
    public DbSet&lt;Order&gt; Orders =&gt; Set&lt;Order&gt;();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity&lt;Order&gt;().Property(o =&gt; o.Total).HasPrecision(18, 2);
        mb.Entity&lt;Order&gt;().HasIndex(o =&gt; new { o.CustomerId, o.CreatedUtc });
    }
}</code></pre></div>

<h2>Migrations: schema as code</h2>
<div class="codeblock"><div class="codeblock-header">terminal</div><pre><code>dotnet ef migrations add InitialCreate      # generates Up/Down C# code
dotnet ef database update                   # applies pending migrations
dotnet ef migrations list                   # history
# Roll back: dotnet ef database update PreviousMigration</code></pre></div>
<p>Migrations live in source control alongside the model. Deploy by running <code>update</code> in CI/CD &mdash; every environment's schema is reproducible from code.</p>

<h2>Querying: LINQ in, SQL out</h2>
<div class="codeblock"><div class="codeblock-header">Queries.cs</div><pre><code>// This LINQ...
var recent = await db.Orders
    .Where(o =&gt; o.CreatedUtc &gt;= DateTime.UtcNow.AddDays(-30))
    .OrderByDescending(o =&gt; o.Total)
    .Select(o =&gt; new { o.Id, o.Total, Customer = o.Customer.Name })   // projection
    .Take(50)
    .ToListAsync(ct);

// ...becomes ONE SQL statement &mdash; the projection joins for you:
// SELECT TOP(50) [o].[Id], [o].[Total], [c].[Name]
// FROM [Orders] AS [o] LEFT JOIN [Customers] AS [c] ON ...
// WHERE [o].[CreatedUtc] &gt;= @ cutoff ORDER BY [o].[Total] DESC</code></pre></div>
<div class="callout warning"><div class="co-title">The N+1 trap</div><p>Lazy-loading navigation properties in a loop fires one query <em>per row</em>. Fix with <code>.Include(o =&gt; o.Customer)</code> (eager load, one JOIN) or projections. Watch the SQL with <code>LogTo(Console.WriteLine)</code> while developing.</p></div>

<h2>Writing data safely</h2>
<div class="codeblock"><div class="codeblock-header">Writes.cs</div><pre><code>// Add + SaveChanges in one transaction:
db.Orders.Add(new Order { CustomerId = 1, Total = 99m, CreatedUtc = DateTime.UtcNow });
await db.SaveChangesAsync(ct);

// Concurrency: optimistic by default &mdash; EF throws if the row changed underneath you:
public byte[] RowVersion { get; set; } = [];
// [Timestamp] byte[] RowVersion &rarr; automatic WHERE RowVersion = @original check

// Transactions across multiple operations:
await using var tx = await db.Database.BeginTransactionAsync(ct);
try { /* multiple SaveChanges */ await tx.CommitAsync(ct); }
catch { await tx.RollbackAsync(ct); throw; }</code></pre></div>

<h2>Performance checklist</h2>
<ul>
  <li><strong>Project, don't fetch</strong>: <code>Select</code> only the columns you need.</li>
  <li><strong>AsNoTracking</strong> for read-only queries &mdash; skips the change tracker entirely.</li>
  <li><strong>Compile hot queries</strong>: <code>EF.CompileAsyncQuery</code> for millisecond-critical paths.</li>
  <li><strong>Batch writes</strong>: one <code>SaveChanges</code> for a group, not per row.</li>
  <li><strong>Raw SQL escape hatch</strong>: <code>FromSqlRaw</code> when the query is genuinely complex.</li>
</ul>
<div class="codeblock"><div class="codeblock-header">FastReads.cs</div><pre><code>var summaries = await db.Orders
    .AsNoTracking()                          // read-only, no tracking overhead
    .Where(o =&gt; o.CustomerId == id)
    .Select(o =&gt; new OrderSummary(o.Id, o.Total))   // DTO projection
    .ToListAsync(ct);</code></pre></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (40 min)</div>
<p>Add EF Core to the task tracker: SQLite provider, <code>TaskItem</code> mapped with a priority index, migration + update. Replace the JSON store's reads with projections and add a <code>Customer</code>-style relation (task &rarr; project table). Provoke and then fix an N+1 by logging SQL. Finally switch the provider string to SQL Server and regenerate &mdash; note how little changes.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>DbSet + DbContext + migrations = schema and data as versioned code.</li>
  <li>LINQ composes into SQL; projections avoid over-fetching.</li>
  <li>Include or project &mdash; never lazy-load in loops.</li>
  <li>AsNoTracking for reads; transactions for multi-step writes.</li>
</ul>
`
};
