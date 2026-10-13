/* Day 23: .NET MAUI & Cross-Platform UI */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[23] = {
  html: `
<p>.NET MAUI compiles one C# + XAML codebase to native apps on Windows, macOS, iOS, and Android &mdash; your MVVM ViewModels from yesterday run unchanged on all of them.</p>

<h2>One project, four platforms</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 220" width="820" height="220" role="img" aria-label="MAUI single project to native platforms">
  <defs><marker id="d23a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="300" y="20" width="220" height="56" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="410" y="44" text-anchor="middle" class="dg-text">One .NET MAUI project</text>
  <text x="410" y="62" text-anchor="middle" class="dg-sub">C# + XAML + one BCL</text>
  <rect x="40" y="140" width="160" height="50" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="120" y="162" text-anchor="middle" class="dg-text">Windows</text><text x="120" y="178" text-anchor="middle" class="dg-sub">WinUI 3</text>
  <rect x="230" y="140" width="160" height="50" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="310" y="162" text-anchor="middle" class="dg-text">Android</text><text x="310" y="178" text-anchor="middle" class="dg-sub">JetPack/native views</text>
  <rect x="430" y="140" width="160" height="50" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="510" y="162" text-anchor="middle" class="dg-text">iOS</text><text x="510" y="178" text-anchor="middle" class="dg-sub">UIKit/Cocoa</text>
  <rect x="620" y="140" width="160" height="50" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="700" y="162" text-anchor="middle" class="dg-text">macOS</text><text x="700" y="178" text-anchor="middle" class="dg-sub">Catalyst</text>
  <line x1="360" y1="76" x2="140" y2="138" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d23a)"/>
  <line x1="395" y1="76" x2="320" y2="138" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d23a)"/>
  <line x1="425" y1="76" x2="505" y2="138" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d23a)"/>
  <line x1="460" y1="76" x2="690" y2="138" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d23a)"/>
  <text x="410" y="205" text-anchor="middle" class="dg-sub">MAUI maps to native controls per platform &mdash; not a web view, real platform UI</text>
</svg>
</div>

<h2>Create and run</h2>
<div class="codeblock"><div class="codeblock-header">terminal</div><pre><code>dotnet workload install maui
dotnet new maui -n TaskTracker.App
dotnet build -f net8.0-android        # or -windows, -ios, -maccatalyst
# On Windows you can F5 the Windows target from Visual Studio immediately.</code></pre></div>

<h2>XAML you already know</h2>
<div class="codeblock"><div class="codeblock-header">TasksPage.xaml</div><pre><code>&lt;ContentPage x:Class="TaskTracker.App.TasksPage"
             xmlns="http://schemas.microsoft.com/dotnet/2021/maui"&gt;
  &lt;Grid RowDefinitions="Auto,*,Auto" Padding="16"&gt;

    &lt;Label Grid.Row="0" Text="Tasks" FontSize="28" /&gt;

    &lt;CollectionView Grid.Row="1" ItemsSource="{Binding Items}"
                    SelectionMode="None"&gt;
      &lt;CollectionView.ItemTemplate&gt;
        &lt;DataTemplate x:DataType="vm:TaskItemViewModel"&gt;
          &lt;Grid ColumnDefinitions="*,Auto" Padding="0,6"&gt;
            &lt;Label Text="{Binding Title}" TextDecorations="{Binding Strike}" /&gt;
            &lt;CheckBox IsChecked="{Binding IsDone}" Command="{Binding CompleteCommand}" /&gt;
          &lt;/Grid&gt;
        &lt;/DataTemplate&gt;
      &lt;/CollectionView.ItemTemplate&gt;
    &lt;/CollectionView&gt;

    &lt;Button Grid.Row="2" Text="Add" Command="{Binding AddCommand}" /&gt;
  &lt;/Grid&gt;
&lt;/ContentPage&gt;</code></pre></div>

<h2>Platform services via interfaces</h2>
<p>Device features (camera, files, geolocation) differ per platform &mdash; MAUI abstracts them behind interfaces you inject:</p>
<div class="codeblock"><div class="codeblock-header">PlatformServices.cs</div><pre><code>public class NotesViewModel(IFileSaver files, IConnectivity connectivity) : ObservableObject
{
    [RelayCommand]
    private async Task SaveAsync()
    {
        if (connectivity.NetworkAccess != NetworkAccess.Internet)
        {
            await Shell.Current.DisplayAlertAsync("Offline", "Try again later", "OK");
            return;
        }
        await files.SaveAsync("tasks.json", Serialize(Items));
    }
}

// Registration &mdash; MAUI's built-in DI container (Day 14 again):
builder.Services.AddSingleton&lt;IFileSaver, FileSaver&gt;();
builder.Services.AddTransient&lt;TasksViewModel&gt;();
builder.Services.AddTransient&lt;TasksPage&gt;();</code></pre></div>
<div class="callout tip"><div class="co-title">Alternatives worth knowing</div><p><strong>Avalonia</strong> for pixel-perfect desktop on Linux too; <strong>Uno</strong> for WebAssembly targets; <strong>Blazor Hybrid</strong> to embed Blazor components inside a MAUI shell &mdash; web skills, native app packaging. All run your same ViewModels.</p></div>

<h2>Ship checklist</h2>
<ul>
  <li>&#9633; Resources in one place: colors, strings (localization-ready) in <code>Resources/</code>.</li>
  <li>&#9633; App icons/splash as single SVG-source assets MAUI converts per platform.</li>
  <li>&#9633; Errors logged to device log + remote telemetry (Day 26's OpenTelemetry).</li>
  <li>&#9633; Release builds: AOT/trimming per platform, signed stores packages.</li>
</ul>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (40 min)</div>
<p>Scaffold a MAUI app, port <code>TaskListViewModel</code> from Day 22, and wire navigation with <code>Shell</code> (a detail page per task). Inject <code>IConnectivity</code> and show an offline banner. If you have no device emulators, target Windows only &mdash; the XAML and VM code are identical everywhere.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>One project &rarr; native UI on four platforms from one BCL.</li>
  <li>MVVM discipline from Day 22 is what makes the port possible.</li>
  <li>Platform capabilities arrive as injectable abstractions.</li>
  <li>Blazor Hybrid is the escape hatch when you want web UI in a native shell.</li>
</ul>
`
};
