let popup = document.querySelector(".popup");

document.querySelectorAll(".code").forEach(codeBlock => {
    let copyBtn = codeBlock.querySelector(".code-copy");
    let codeText = codeBlock.querySelector(".code-text");

    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(codeText.innerText.trim()).then(() => {
            copyBtn.innerText = "تم النسخ";
            popup.style.display = "block";

            setTimeout(() => {
                copyBtn.innerText = "نسخ";
                popup.style.display = "none";
            }, 1200);
        });
    });
});

document.querySelectorAll(".code-one").forEach(span => {
    span.addEventListener("click", () => {
        navigator.clipboard.writeText(span.innerText.trim()).then(() => {
            popup.style.display = "block";

            setTimeout(() => {
                popup.style.display = "none";
            }, 1200);
        });
    });
});

let code = `
param(
    [Parameter(Mandatory=$true, ValueFromPipeline=$true, ValueFromPipelineByPropertyName=$true)]
    [string[]]$Videos
)

foreach ($video in $Videos) {
    Write-Host "=============================="
    Write-Host "Processing video: $video"
    Write-Host "==============================\`n"

    $dir = Split-Path $video
    $filename = Split-Path $video -Leaf
    $name = [System.IO.Path]::GetFileNameWithoutExtension($filename)

    $audio = Join-Path $dir "$name.wav"
    $vocals_wav = Join-Path $dir "separated\htdemucs\$name\vocals.wav"
    $vocals_mp3 = Join-Path $dir "$name\`_vocals.mp3"
    $output_video = Join-Path $dir "$name\`_vocals.mp4"

    Clear-Host
    Write-Host "=============================="
    Write-Host "1) Extracting audio..."
    Write-Host "==============================\`n"

    ffmpeg -y -i "$video" -vn -acodec pcm_s16le "$audio"

    Clear-Host
    Write-Host "=============================="
    Write-Host "2) Remove music..."
    Write-Host "==============================\`n"

    demucs "$audio"

    if (-not (Test-Path $vocals_wav)) {
        Write-Host "❌ Error: vocals.wav not found"
        continue
    }

    Clear-Host
    Write-Host "=============================="
    Write-Host "3) Compress audio to MP3..."
    Write-Host "==============================\`n"

    ffmpeg -y -i "$vocals_wav" -codec:a libmp3lame -b:a 192k "$vocals_mp3"

    Clear-Host
    Write-Host "=============================="
    Write-Host "4) Merging audio with video..."
    Write-Host "==============================\`n"

    ffmpeg -y -i "$video" -i "$vocals_mp3" -map 0:v:0 -map 1:a:0 -c:v copy -shortest "$output_video"

    Clear-Host
    Write-Host "=============================="
    Write-Host "5) Cleaning temp files..."
    Write-Host "==============================\`n"

    Remove-Item -Force "$audio", "$vocals_mp3"

    $sep_dir = Join-Path $dir "separated\htdemucs"
    $my_dir = Join-Path $sep_dir $name

    if (Test-Path $sep_dir) {
        $subdirs = Get-ChildItem -Path $sep_dir -Directory
        if ($subdirs.Count -eq 1 -and (Test-Path $my_dir)) {
            Remove-Item -Recurse -Force (Join-Path $dir "separated")
            Write-Host "Removed /separated بالكامل"
        }
        else {
            Remove-Item -Recurse -Force $my_dir
            Write-Host "Removed $my_dir فقط"
        }
    }

    Write-Host "\`n✅ Done: $output_video\`n"
}

Write-Host "=============================="
Write-Host "All tasks finished ✅"
Start-Sleep -Seconds 5
`;

let bigCode = document.querySelector(".big-code");

bigCode.addEventListener("click", () => {
    navigator.clipboard.writeText(code.trim()).then(() => {
        popup.style.display = "block";

        setTimeout(() => {
            popup.style.display = "none";
        }, 1200);
    });
});