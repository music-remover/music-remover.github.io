// ===== COPY POPUP =====
const popup = document.getElementById('copy-popup');

function showPopup() {
    popup.style.display = 'block';
    setTimeout(() => popup.style.display = 'none', 1200);
}

document.querySelectorAll('.code').forEach(block => {
    const btn = block.querySelector('.code-copy');
    const text = block.querySelector('.code-text');
    btn.addEventListener('click', () => {
        navigator.clipboard.writeText(text.innerText.trim()).then(() => {
            btn.innerText = 'تم النسخ';
            showPopup();
            setTimeout(() => btn.innerText = 'نسخ', 1200);
        });
    });
});

document.querySelectorAll('.code-one').forEach(span => {
    span.addEventListener('click', () => {
        navigator.clipboard.writeText(span.innerText.trim()).then(showPopup);
    });
});

// ===== BIG CODE =====
const psCode = `param(
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
    $vocals_final = Join-Path $dir "$name\`_vocals$ext"

    if ($ext -in ".mp3", ".wav", ".flac", ".m4a") {
        $vocals_wav = Join-Path $dir "separated\htdemucs\$name\vocals.wav"
        Clear-Host
        Write-Host "=============================="
        Write-Host "1) Removing music from audio..."
        Write-Host "==============================\`n"
        demucs "$file"
        if (-not (Test-Path $vocals_wav)) { Write-Host "Error: vocals.wav not found"; continue }
        Clear-Host
        Write-Host "=============================="
        Write-Host "2) Converting vocals to original format..."
        Write-Host "==============================\`n"
        ffmpeg -y -i "$vocals_wav" "$vocals_final"
        Write-Host "\`nDone: $vocals_final\`n"
    }
    elseif ($ext -in ".mp4", ".mkv", ".avi", ".mov", ".flv") {
        $audio = Join-Path $dir "$name.wav"
        $vocals_wav = Join-Path $dir "separated\htdemucs\$name\vocals.wav"
        $vocals_mp3 = Join-Path $dir "$name\`_vocals.mp3"
        $output_video = Join-Path $dir "$name\`_vocals.mp4"
        Clear-Host
        Write-Host "1) Extracting audio from video..."
        ffmpeg -y -i "$file" -vn -acodec pcm_s16le "$audio"
        Clear-Host
        Write-Host "2) Removing music..."
        demucs "$audio"
        if (-not (Test-Path $vocals_wav)) { Write-Host "Error: vocals.wav not found"; continue }
        Clear-Host
        Write-Host "3) Compressing vocals to MP3..."
        ffmpeg -y -i "$vocals_wav" -codec:a libmp3lame -b:a 192k "$vocals_mp3"
        Clear-Host
        Write-Host "4) Merging vocals with video..."
        ffmpeg -y -i "$file" -i "$vocals_mp3" -map 0:v:0 -map 1:a:0 -c:v copy -shortest "$output_video"
        Clear-Host
        Write-Host "5) Cleaning temporary files..."
        Remove-Item -Force "$audio", "$vocals_mp3"
        $sep_dir = Join-Path $dir "separated\htdemucs"
        $my_dir = Join-Path $sep_dir $name
        if (Test-Path $sep_dir) {
            $subdirs = Get-ChildItem -Path $sep_dir -Directory
            if ($subdirs.Count -eq 1 -and (Test-Path $my_dir)) {
                Remove-Item -Recurse -Force (Join-Path $dir "separated")
            } else {
                Remove-Item -Recurse -Force $my_dir
            }
        }
        Write-Host "\`nDone: $output_video\`n"
    }
}

Write-Host "=============================="
Write-Host "All tasks finished"
Start-Sleep -Seconds 5`;

const Linux_psCode = `#!/bin/bash

FILES=("$@")

for file in "\${FILES[@]}"; do
    echo "=============================="
    echo "Processing file: $file"
    echo "=============================="

    dir=$(dirname "$file")
    filename=$(basename "$file")
    name="\${filename%.*}"
    ext="\${filename##*.}"
    ext="\${ext,,}"  # lowercase

    vocals_final="$dir/\${name}_vocals.$ext"

    case "$ext" in
        mp3|wav|flac|m4a)
            model_dir=$(find "$dir/separated" -type d -name "$name" | head -n 1)
            vocals_wav="$model_dir/vocals.wav"
            
            echo "=============================="
            echo "1) Removing music from audio..."
            echo "=============================="
            demucs "$file"
            if [[ ! -f "$vocals_wav" ]]; then
                echo "Error: vocals.wav not found"
                continue
            fi
            echo "=============================="
            echo "2) Converting vocals to original format..."
            echo "=============================="
            ffmpeg -y -i "$vocals_wav" "$vocals_final"
            echo "Done: $vocals_final"
            ;;

        mp4|mkv|avi|mov|flv)
            audio="$dir/$name.wav"
            vocals_wav="$dir/separated/htdemucs/$name/vocals.wav"
            vocals_mp3="$dir/\${name}_vocals.mp3"
            output_video="$dir/\${name}_vocals.mp4"

            echo "1) Extracting audio from video..."
            ffmpeg -y -i "$file" -vn -acodec pcm_s16le "$audio"

            echo "2) Removing music..."
            demucs "$audio"
            if [[ ! -f "$vocals_wav" ]]; then
                echo "Error: vocals.wav not found"
                continue
            fi

            echo "3) Compressing vocals to MP3..."
            ffmpeg -y -i "$vocals_wav" -codec:a libmp3lame -b:a 192k "$vocals_mp3"

            echo "4) Merging vocals with video..."
            ffmpeg -y -i "$file" -i "$vocals_mp3" -map 0:v:0 -map 1:a:0 -c:v copy -shortest "$output_video"

            echo "5) Cleaning temporary files..."
            rm -f "$audio" "$vocals_mp3"

            sep_dir="$dir/separated/htdemucs"
            my_dir="$sep_dir/$name"
            if [[ -d "$sep_dir" ]]; then
                shopt -s nullglob
                subdirs=("$sep_dir"/*)
                
                if [[ \${#subdirs[@]} -eq 1 && -d "$my_dir" ]]; then
                    rm -rf "$dir/separated"
                else
                    rm -rf "$my_dir"
                fi
            fi
            echo "Done: $output_video"
            ;;
        *)
            echo "Unsupported file type: $file"
            ;;
    esac
done

echo "=============================="
echo "All tasks finished"
sleep 5`;

document.querySelector('#hacker-overlay .big-code').addEventListener('click', () => {
    navigator.clipboard.writeText(Linux_psCode.trim()).then(showPopup);
});

document.querySelector('.container .big-code').addEventListener('click', () => {
    navigator.clipboard.writeText(psCode.trim()).then(showPopup);
});

// ===== MATRIX EFFECT =====
const matrixCanvas = document.getElementById('matrix-canvas');
const mCtx = matrixCanvas.getContext('2d');
let matrixInterval;

function startMatrix() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    const cols = Math.floor(matrixCanvas.width / 20);
    const drops = Array(cols).fill(1);
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';

    matrixInterval = setInterval(() => {
        mCtx.fillStyle = 'rgba(0,0,0,0.05)';
        mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        mCtx.fillStyle = '#0f0';
        mCtx.font = '18px monospace';
        drops.forEach((y, i) => {
            const char = chars[Math.floor(Math.random() * chars.length)];
            mCtx.fillText(char, i * 20, y * 20);
            if (y * 20 > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        });
    }, 50);
}

// ===== HACKER FACE =====
// Using hacker.png image instead of canvas drawing

// ===== HACKER SOUND =====
function playEvilLaugh() {
    const audio = new Audio('laugh.mp3');
    audio.play();
}

// ===== MAIN ANIMATION SEQUENCE =====
const mainCont = document.querySelector('.container');
const overlay = document.getElementById('hacker-overlay');
const hackerFace = document.getElementById('hacker-face');
const linuxSteps = document.getElementById('linux-steps');

document.getElementById('linux-btn').addEventListener('click', () => {
    // Step 1: Show overlay with matrix
    mainCont.style.display = 'none';
    overlay.style.display = 'block';
    startMatrix();

    // Step 2: After 1s, slide face from left + play laugh
    setTimeout(() => {
        playEvilLaugh();
        hackerFace.style.transition = 'left 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        hackerFace.style.left = '50%';
        hackerFace.style.transform = 'translate(-50%, -50%)';

        // Image is already loaded, no need to animate drawing
        const faceAnim = null;

        // Step 3: Face zooms in close
        setTimeout(() => {
            hackerFace.style.transition = 'all 1.5s ease-in';
            hackerFace.style.width = '900px';
            hackerFace.style.height = '900px';
            hackerFace.style.top = '50%';
            hackerFace.style.left = '50%';
            hackerFace.style.transform = 'translate(-50%, -50%)';

            // Step 4: Show Linux steps
            setTimeout(() => {
                if (faceAnim) clearInterval(faceAnim);
                clearInterval(matrixInterval);
                hackerFace.style.display = 'none';
                linuxSteps.style.display = 'block';

                // Bind copy buttons in linux steps
                linuxSteps.querySelectorAll('.code').forEach(block => {
                    const btn = block.querySelector('.code-copy');
                    const text = block.querySelector('.code-text');
                    if (!btn._bound) {
                        btn.addEventListener('click', () => {
                            navigator.clipboard.writeText(text.innerText.trim()).then(() => {
                                btn.innerText = 'تم النسخ';
                                showPopup();
                                setTimeout(() => btn.innerText = 'نسخ', 1200);
                            });
                        });
                        btn._bound = true;
                    }
                });

                linuxSteps.querySelectorAll('.code-one').forEach(span => {
                    if (!span._bound) {
                        span.addEventListener('click', () => {
                            navigator.clipboard.writeText(span.innerText.trim()).then(showPopup);
                        });
                        span._bound = true;
                    }
                });

            }, 1500);
        }, 2000);
    }, 1000);
});

// Close button
document.getElementById('close-overlay').addEventListener('click', () => {
    mainCont.style.display = 'block';
    overlay.style.display = 'none';
    linuxSteps.style.display = 'none';
    hackerFace.style.display = 'block';
    hackerFace.style.left = '-400px';
    hackerFace.style.width = '300px';
    hackerFace.style.height = '300px';
    hackerFace.style.transition = 'none';
    clearInterval(matrixInterval);
});
