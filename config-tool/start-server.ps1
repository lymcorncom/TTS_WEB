# 配置工具服务器启动脚本
param(
    [int]$Port = 9001
)

Write-Host "正在启动配置工具服务器..." -ForegroundColor Green
Write-Host "端口: $Port" -ForegroundColor Yellow

try {
    # 尝试使用Python启动HTTP服务器
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Host "使用Python启动服务器..." -ForegroundColor Cyan
        python -m http.server $Port --bind 127.0.0.1
    }
    elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
        Write-Host "使用Python3启动服务器..." -ForegroundColor Cyan
        python3 -m http.server $Port --bind 127.0.0.1
    }
    else {
        Write-Host "未找到Python，尝试使用PowerShell内置功能..." -ForegroundColor Yellow
        
        # 使用PowerShell创建简单的HTTP服务器
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$Port/")
        $listener.Start()
        
        Write-Host "配置工具服务器已启动: http://localhost:$Port" -ForegroundColor Green
        Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
        
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $localPath = $request.Url.LocalPath
            if ($localPath -eq "/") {
                $localPath = "/index.html"
            }
            
            $filePath = Join-Path $PWD $localPath.TrimStart('/')
            
            if (Test-Path $filePath) {
                $content = Get-Content $filePath -Raw -Encoding UTF8
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
                
                # 设置Content-Type
                $extension = [System.IO.Path]::GetExtension($filePath)
                switch ($extension) {
                    ".html" { $response.ContentType = "text/html; charset=utf-8" }
                    ".css" { $response.ContentType = "text/css; charset=utf-8" }
                    ".js" { $response.ContentType = "application/javascript; charset=utf-8" }
                    ".json" { $response.ContentType = "application/json; charset=utf-8" }
                    default { $response.ContentType = "text/plain; charset=utf-8" }
                }
                
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            else {
                $response.StatusCode = 404
                $notFound = "404 - File Not Found: $localPath"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($notFound)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            
            $response.Close()
        }
    }
}
catch {
    Write-Host "启动服务器时出错: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请检查端口 $Port 是否被占用" -ForegroundColor Yellow
}
finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
}