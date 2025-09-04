param(
    [string]$Root = ".",
    [int]$Port = 9001
)

$ErrorActionPreference = "Stop"

$Root = [System.IO.Path]::GetFullPath($Root)
Write-Host "Static server root: $Root"
Write-Host "Listening on http://localhost:$Port/"

$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

# MIME types
function Get-ContentType([string]$ext) {
    switch ($ext.ToLowerInvariant()) {
        ".html" { return "text/html; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".mjs"  { return "application/javascript; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".svg"  { return "image/svg+xml" }
        ".webp" { return "image/webp" }
        ".ico"  { return "image/x-icon" }
        ".mp3"  { return "audio/mpeg" }
        ".wav"  { return "audio/wav" }
        ".ogg"  { return "audio/ogg" }
        default { return "application/octet-stream" }
    }
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $request = $context.Request
            $response = $context.Response

            $path = $request.Url.AbsolutePath
            if ($path -eq "/" -or [string]::IsNullOrWhiteSpace($path)) {
                $relative = "index.html"
            } else {
                $relative = [Uri]::UnescapeDataString($path.TrimStart('/'))
            }

            $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Root, $relative))

            # 防止路径穿越
            if (-not $fullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.OutputStream.Write($bytes,0,$bytes.Length)
                $response.Close()
                continue
            }

            if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
                $response.StatusCode = 404
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $relative")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.OutputStream.Write($bytes,0,$bytes.Length)
                $response.Close()
                continue
            }

            $ext = [System.IO.Path]::GetExtension($fullPath)
            $contentType = Get-ContentType $ext

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentType = $contentType
            $response.StatusCode = 200
            $response.ContentLength64 = $bytes.Length
            $response.Headers.Add("Access-Control-Allow-Origin","*")
            $response.OutputStream.Write($bytes,0,$bytes.Length)
            $response.Close()
        } catch {
            try {
                $response = $context.Response
                $response.StatusCode = 500
                $msg = "500 Internal Server Error: " + $_.Exception.Message
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
                $response.ContentType = "text/plain; charset=utf-8"
                $response.OutputStream.Write($bytes,0,$bytes.Length)
                $response.Close()
            } catch {}
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}