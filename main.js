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
    [string[]]$Files
)

foreach ($file in $Files) {
    Write-Host "=============================="
    Write-Host "Processing file: $file"
    Write-Host "==============================\`n"

    $dir = Split-Path $file
    $filename = Split-Path $file -Leaf
    $name = [System.IO.Path]::GetFileNameWithoutExtension($filename)

    $ext = [System.IO.Path]::GetExtension($filename).ToLower()
    
    # final output file keeping the same extension
    $vocals_final = Join-Path $dir "$name\`_vocals$ext"

    # If the file is audio
    if ($ext -in ".mp3", ".wav", ".flac", ".m4a") {

        $vocals_wav = Join-Path $dir "separated\htdemucs\$name\vocals.wav"

        Write-Host "=============================="
        Write-Host "1) Removing music from audio..."
        Write-Host "==============================\`n"

        demucs "$file"

        if (-not (Test-Path $vocals_wav)) {
            Write-Host "Error: vocals.wav not found"
            continue
        }

        Write-Host "=============================="
        Write-Host "2) Converting vocals to original format..."
        Write-Host "==============================\`n"

        ffmpeg -y -i "$vocals_wav" "$vocals_final"

        Write-Host "\`nDone: $vocals_final\`n"

    }
    else {
        # If the file is a video
        $audio = Join-Path $dir "$name.wav"
        $vocals_wav = Join-Path $dir "separated\htdemucs\$name\vocals.wav"
        $vocals_mp3 = Join-Path $dir "$name\`_vocals.mp3"
        $output_video = Join-Path $dir "$name\`_vocals.mp4"

        Clear-Host
        Write-Host "=============================="
        Write-Host "1) Extracting audio from video..."
        Write-Host "==============================\`n"

        ffmpeg -y -i "$file" -vn -acodec pcm_s16le "$audio"

        Clear-Host
        Write-Host "=============================="
        Write-Host "2) Removing music..."
        Write-Host "==============================\`n"

        demucs "$audio"

        if (-not (Test-Path $vocals_wav)) {
            Write-Host "Error: vocals.wav not found"
            continue
        }

        Clear-Host
        Write-Host "=============================="
        Write-Host "3) Compressing vocals to MP3..."
        Write-Host "==============================\`n"

        ffmpeg -y -i "$vocals_wav" -codec:a libmp3lame -b:a 192k "$vocals_mp3"

        Clear-Host
        Write-Host "=============================="
        Write-Host "4) Merging vocals with video..."
        Write-Host "==============================\`n"

        ffmpeg -y -i "$file" -i "$vocals_mp3" -map 0:v:0 -map 1:a:0 -c:v copy -shortest "$output_video"

        Clear-Host
        Write-Host "=============================="
        Write-Host "5) Cleaning temporary files..."
        Write-Host "==============================\`n"

        Remove-Item -Force "$audio", "$vocals_mp3"

        $sep_dir = Join-Path $dir "separated\htdemucs"
        $my_dir = Join-Path $sep_dir $name

        if (Test-Path $sep_dir) {
            $subdirs = Get-ChildItem -Path $sep_dir -Directory
            if ($subdirs.Count -eq 1 -and (Test-Path $my_dir)) {
                Remove-Item -Recurse -Force (Join-Path $dir "separated")
                Write-Host "Removed /separated completely"
            }
            else {
                Remove-Item -Recurse -Force $my_dir
                Write-Host "Removed $my_dir only"
            }
        }

        Write-Host "\`nDone: $output_video\`n"
    }
}

Write-Host "=============================="
Write-Host "All tasks finished"
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
