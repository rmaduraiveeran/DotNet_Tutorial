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

<h2>Model + DbContext: how mapping decisions get made</h2>
<p>EF Core maps by convention first (<code>Id</code> &rarr; PK, <code>OrderId</code> on <code>OrderLine</code> &rarr; FK), then your configuration overrides. Configuration lives in <code>OnModelCreating</code> (shown here), per-type <code>IEntityTypeConfiguration&lt;T&gt;</code> classes (cleaner for big models), or data annotations (weakest &mdash; couples domain to EF).</p>
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
    public OrderStatus Status { get; set; }           // enum &rarr; stored how? see below
    public int CustomerId { get; set; }               // FK shadowed by convention
    public Customer? Customer { get; set; }           // reference navigation
    public List&lt;OrderLine&gt; Lines { get; set; } = [];  // collection navigation
}

public enum OrderStatus { Pending, Paid, Shipped, Cancelled }

public class ShopContext : DbContext
{
    public DbSet&lt;Customer&gt; Customers =&gt; Set&lt;Customer&gt;();
    public DbSet&lt;Order&gt; Orders =&gt; Set&lt;Order&gt;();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity&lt;Order&gt;(order =&gt;
        {
            order.Property(o =&gt; o.Total).HasPrecision(18, 2);   // decimal precision &mdash; do not skip
            order.HasIndex(o =&gt; new { o.CustomerId, o.CreatedUtc });  // matches the query pattern
            order.Property(o =&gt; o.Status)
                 .HasConversion&lt;string&gt;()            // store "Paid" not the int &mdash; readable data
                 .HasMaxLength(16);
            order.HasOne(o =&gt; o.Customer)            // explicit relationship
                 .WithMany(c =&gt; c.Orders)
                 .HasForeignKey(o =&gt; o.CustomerId)
                 .OnDelete(DeleteBehavior.Restrict); // block deleting customers with orders
        });
    }
}</code></pre></div>
<div class="table-wrap"><table>
<thead><tr><th>Key generation strategy</th><th>How it works</th><th>Choose when</th></tr></thead>
<tbody>
<tr><td><code>int/long Identity</code> (default)</td><td>DB assigns on insert</td><td>single DB, simplest &mdash; the default for a reason</td></tr>
<tr><td><code>Guid</code> (client-generated)</td><td>app assigns before insert</td><td>need IDs before saving; avoids round-trip</td></tr>
<tr><td><code>Guid v7</code> (use <code>UseHelloWorld</code>-style sequencing or .NET 9&rsquo;s <code>Guid.CreateVersion7()</code>)</td><td>time-ordered GUID</td><td>GUIDs without index fragmentation pain</td></tr>
<tr><td>Composite / natural keys</td><td>business columns as PK</td><td>rarely; joins and updates get painful</td></tr>
</tbody></table></div>
<div class="callout tip"><div class="co-title">Owned entities &mdash; DDD value objects without extra tables</div><p><code>mb.OwnsOne&lt;Address&gt;(c =&gt; c.ShipTo)</code> maps a value object as columns on the owner&rsquo;s table (<code>ShipTo_Street</code>, &hellip;). No join, no key, perfect for immutable value objects from Day 5&rsquo;s records. It is the standard bridge between DDD value objects and relational storage.</p></div>

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
<h2>Loading related data: the four strategies</h2>
<p>This is where EF Core careers are made and broken. Choosing deliberately:</p>
<div class="table-wrap"><table>
<thead><tr><th>Strategy</th><th>Code</th><th>SQL produced</th><th>Use when</th></tr></thead>
<tbody>
<tr><td><strong>Eager</strong></td><td><code>.Include(o =&gt; o.Lines)</code></td><td>one query with JOIN</td><td>you know you need the related rows now</td></tr>
<tr><td><strong>Explicit</strong></td><td><code>context.Entry(o).Collection(...).LoadAsync()</code></td><td>separate query, on demand</td><td>decision made after inspecting the entity</td></tr>
<tr><td><strong>Lazy</strong></td><td>touch <code>o.Lines</code> (needs proxy package)</td><td>query on first access</td><td>almost never &mdash; this is the N+1 factory</td></tr>
<tr><td><strong>Projection</strong></td><td><code>.Select(o =&gt; new Dto(...))</code></td><td>only requested columns</td><td>read models / APIs &mdash; the default choice</td></tr>
</tbody></table></div>
<div class="callout warning"><div class="co-title">The N+1 trap</div><p>Lazy-loading navigation properties in a loop fires one query <em>per row</em>: 100 orders &times; 1 query each = 101 round-trips. Fix with <code>.Include</code> (one JOIN), <code>AsSplitQuery()</code> (multiple tight queries instead of a cartesian JOIN), or projections. Watch the SQL with <code>LogTo(Console.WriteLine)</code> or the <strong>EF Core interceptors</strong> shown below while developing.</p></div>
<div class="codeblock"><div class="codeblock-header">Loading.cs &mdash; includes, split queries, filtered includes</div><pre><code>// Eager + filtered include &mdash; only pending lines, in one query:
var orders = await db.Orders
    .Include(o =&gt; o.Lines.Where(l =&gt; l.Quantity &gt; 0))
    .Where(o =&gt; o.CustomerId == id)
    .ToListAsync(ct);

// Multiple collection includes &rarr; cartesian explosion (joins multiply rows).
// SplitQuery turns each include into its own SELECT &mdash; often cheaper overall:
var detailed = await db.Orders
    .Include(o =&gt; o.Lines)
    .Include(o =&gt; o.Shipments)
    .AsSplitQuery()                      // 3 queries, no row multiplication
    .ToListAsync(ct);

// Global default (careful) in OnConfiguring:
//   optionsBuilder.UseSqlServer(conn, o =&gt; o.UseRelationalNulls());  // etc.</code></pre></div>

<h2>Change tracking: what SaveChanges actually does</h2>
<p>The <strong>change tracker</strong> is EF&rsquo;s unit of work. Entities you query are <em>tracked</em>: EF takes a snapshot, and on <code>SaveChanges</code> it diffs properties to generate minimal UPDATE statements. Add &rarr; INSERT, modified &rarr; UPDATE, removed &rarr; DELETE, all batched in one transaction per call.</p>
<div class="codeblock"><div class="codeblock-header">Tracking.cs &mdash; the state machine</div><pre><code>var order = await db.Orders.FirstAsync(o =&gt; o.Id == 7, ct);   // now tracked (Unchanged)
order.Status = OrderStatus.Paid;                              // &rarr; Modified (diffed on save)
db.Orders.Remove(order);                                      // &rarr; Deleted
await db.SaveChangesAsync(ct);                                // one batched transaction

// Detached DTOs (e.g., from an API PUT) must be re-attached:
var incoming = new Order { Id = 7, Status = OrderStatus.Paid };
db.Orders.Update(incoming);                                   // &rarr; marks ALL properties modified
await db.SaveChangesAsync(ct);

// Inspect what the tracker thinks:
foreach (var e in db.ChangeTracker.Entries())
    Console.WriteLine($"{e.Entity.GetType().Name}: {e.State}");</code></pre></div>
<div class="callout note"><div class="co-title">DbContext lifetime = Scoped, always</div><p><code>AddDbContext</code> registers <code>AppDbContext</code> as <strong>scoped</strong>: one instance per HTTP request, disposed at its end. It is not thread-safe &mdash; never share across requests or <code>Parallel</code> loops; spin one per worker via <code>IDbContextFactory&lt;T&gt;</code> (register with <code>AddDbContextFactory</code>) for background services and Blazor.</p></div>

<h2>Writing data safely: transactions and concurrency</h2>
<div class="codeblock"><div class="codeblock-header">Writes.cs</div><pre><code>// Add + SaveChanges in one implicit transaction:
db.Orders.Add(new Order { CustomerId = 1, Total = 99m,
                          Status = OrderStatus.Pending, CreatedUtc = DateTime.UtcNow });
await db.SaveChangesAsync(ct);

// Optimistic concurrency &mdash; SQL Server rowversion (or a Guid/timestamp column elsewhere):
public class Order
{
    // ...
    [Timestamp] public byte[] RowVersion { get; set; } = [];
}
// On save EF emits:  UPDATE ... WHERE Id = @id AND RowVersion = @original
// 0 rows affected &rarr; DbUpdateConcurrencyException &rarr; YOU decide: overwrite or refetch.

try { await db.SaveChangesAsync(ct); }
catch (DbUpdateConcurrencyException)
{
    var entry = ex.Entries.Single();
    var dbValues = await entry.GetDatabaseValuesAsync(ct);   // someone else won
    // business decision: client-wins, db-wins, or surface 409 to the caller
}

// Explicit transaction across multiple SaveChanges:
await using var tx = await db.Database.BeginTransactionAsync(ct);
try
{
    db.Orders.Add(order);
    await db.SaveChangesAsync(ct);
    db.AuditLogs.Add(new AuditLog("order-created", order.Id));
    await db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);
}
catch { await tx.RollbackAsync(ct); throw; }</code></pre></div>

<h2>Interceptors: cross-cutting without polluting your code</h2>
<div class="codeblock"><div class="codeblock-header">AuditInterceptor.cs &mdash; see/touch every query and save</div><pre><code>public class AuditInterceptor : SaveChangesInterceptor
{
    public override ValueTask&lt;InterceptorResult&lt;int&gt;&gt; SavingChangesAsync(
        DbContextEventData data, InterceptorResult&lt;int&gt; result, CancellationToken ct = default)
    {
        var db = data.Context!;
        foreach (var entry in db.ChangeTracker.Entries&lt;IAuditable&gt;())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedUtc = DateTime.UtcNow;
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedUtc = DateTime.UtcNow;
        }
        return base.SavingChangesAsync(data, result, ct);
    }
}
// optionsBuilder.AddInterceptors(new AuditInterceptor());
// Also exist: DbCommandInterceptor (log/rewrite SQL), ConnectionInterceptor, &hellip;</code></pre></div>

<h2>Performance checklist</h2>
<ul>
  <li><strong>Project, don't fetch</strong>: <code>Select</code> only the columns you need &mdash; the single biggest win.</li>
  <li><strong>AsNoTracking</strong> for read-only queries &mdash; skips snapshots and identity resolution entirely.</li>
  <li><strong>Batch writes</strong>: one <code>SaveChanges</code> for a group, not per row (EF batches automatically).</li>
  <li><strong>Indexes match queries</strong>: migrations create them; missing indexes are a DB problem wearing an EF costume.</li>
  <li><strong>Beware client evaluation</strong>: operations EF cannot translate throw in .NET 5+ (good!) &mdash; but <code>AsEnumerable()</code> mid-query silently pulls everything into memory.</li>
  <li><strong>Compiled queries</strong>: <code>EF.CompileAsyncQuery</code> for millisecond-critical hot paths.</li>
  <li><strong>Raw SQL escape hatch</strong>: <code>FromSqlRaw</code> / <code>SqlQuery</code> when the query is genuinely relational-complex.</li>
</ul>
<div class="codeblock"><div class="codeblock-header">FastReads.cs + the escape hatches</div><pre><code>var summaries = await db.Orders
    .AsNoTracking()                          // read-only, no tracking overhead
    .Where(o =&gt; o.CustomerId == id)
    .Select(o =&gt; new OrderSummary(o.Id, o.Total))   // DTO projection
    .ToListAsync(ct);

// Escape hatch 1 &mdash; parameterized raw SQL (compose with LINQ after!):
var raw = db.Orders.FromSqlInterpolated(
    $"SELECT * FROM Orders WHERE CustomerId = {id}")
    .Where(o =&gt; o.Total &gt; 100m).ToListAsync(ct);      // composed client-side, still parameterized

// Escape hatch 2 &mdash; arbitrary SQL without entity mapping (.NET 8):
var counts = await db.Database
    .SqlQuery&lt;$"SELECT Status, COUNT(*) AS N FROM Orders GROUP BY Status"&gt;()
    .ToListAsync(ct);</code></pre></div>

<h2>Testing with the in-memory + SQLite providers</h2>
<div class="codeblock"><div class="codeblock-header">ShopContextTests.cs</div><pre><code>// Option A &mdash; InMemory provider: fast, but NO relational semantics
//   (no FK enforcement, no transactions, different LINQ translation edge cases).
// Option B &mdash; SQLite in-memory: real relational behavior, one line of setup:
public class ShopContextTests
{
    private static ShopContext CreateContext()
    {
        var conn = new SqliteConnection("DataSource=:memory:");
        conn.Open();                                   // keep open for the test lifetime
        var options = new DbContextOptionsBuilder&lt;ShopContext&gt;()
            .UseSqlite(conn)
            .Options;
        var db = new ShopContext(options);
        db.Database.EnsureCreated();                   // schema from model &mdash; no migrations needed
        return db;
    }

    [Fact]
    public async Task Order_WithoutCustomer_Fails()
    {
        using var db = CreateContext();
        db.Orders.Add(new Order { CustomerId = 999, Total = 1m });
        await Assert.ThrowsAsync&lt;DbUpdateException&gt;(() =&gt; db.SaveChangesAsync());
        // FK enforcement proves you are testing real relational behavior
    }
}
// For full fidelity, integration-test against real SQL Server in a Docker container (Day 26).</code></pre></div>

<h2>Migrations in CI/CD &mdash; the safe pattern</h2>
<div class="codeblock"><div class="codeblock-header">terminal &mdash; production schema management</div><pre><code># Generate idempotent SQL script from migrations (reviewable in PRs):
dotnet ef migrations script --idempotent -o deploy.sql

# Or apply at startup (fine for small apps; races with multiple replicas!):
#   db.Database.Migrate();

# Best practice for scaled-out deployments:
#   CI generates script &rarr; DBA/CD applies it ONCE before the new version rolls out
#   &rarr; app starts against an already-current schema (no startup permissions needed)</code></pre></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (40 min)</div>
<p>Add EF Core to the task tracker: SQLite provider, <code>TaskItem</code> with an enum stored as string, a priority index, migration + update. Replace the JSON store's reads with projections and add a relation (task &rarr; project table with <code>OnDelete(DeleteBehavior.Restrict)</code>). Provoke and then fix an N+1 by logging SQL. Add the <code>AuditInterceptor</code> for timestamps. Write a test with SQLite in-memory proving FK enforcement. Finally switch the provider string to SQL Server and regenerate &mdash; note how little changes.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>DbSet + DbContext + migrations = schema and data as versioned, reviewable code.</li>
  <li>Configure relationships, precision, and conversions explicitly &mdash; conventions are defaults, not decisions.</li>
  <li>Loading strategy is a per-query choice: project &gt; include &gt; split query &gt; never lazy-in-loops.</li>
  <li>DbContext is scoped and not thread-safe; one per request, factories for background work.</li>
  <li>Optimistic concurrency with rowversion + <code>DbUpdateConcurrencyException</code>; transactions via the database API; interceptors for cross-cutting.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Provoke a cartesian-explosion with two <code>Include</code>d collections, then fix with <code>AsSplitQuery</code> &mdash; log both SQLs.</li><li>Add a global query filter (<code>HasQueryFilter(t =&gt; !t.IsDeleted)</code>) and a <code>IgnoreQueryFilters()</code> path for admins.</li><li>Implement a <code>DbCommandInterceptor</code> that logs any query taking &gt; 100ms.</li></ul>
`,
  quiz: [
    {
      "q": "The N+1 problem is…",
      "a": [
        "A SQL syntax error",
        "One query per row from lazy-loading in loops",
        "An index issue",
        "Too many joins"
      ],
      "correct": 1,
      "expl": "Fix with Include, split queries, or projections."
    },
    {
      "q": "AsNoTracking() matters because tracking…",
      "a": [
        "Encrypts data",
        "Keeps snapshots for change detection — wasted on read-only queries",
        "Blocks indexes",
        "Is required for LINQ"
      ],
      "correct": 1,
      "expl": "Reads skip the change tracker for speed and less memory."
    },
    {
      "q": "DbContext lifetime should be…",
      "a": [
        "Singleton",
        "Scoped per request",
        "Transient per query",
        "Static"
      ],
      "correct": 1,
      "expl": "Scoped: one per request, not thread-safe, disposed at request end."
    },
    {
      "q": "[Timestamp] byte[] RowVersion gives you…",
      "a": [
        "Full backups",
        "Optimistic concurrency via WHERE version checks",
        "Auditing",
        "Encryption"
      ],
      "correct": 1,
      "expl": "EF throws DbUpdateConcurrencyException when the version moved."
    }
  ]

};