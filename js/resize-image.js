document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const fileCountDisplay = document.getElementById('fileCountDisplay');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const resizeAllButton = document.getElementById('resizeAllButton');
    const resizedImagesContainer = document.getElementById('resizedImagesContainer');
    const downloadAllButton = document.getElementById('downloadAllButton');
    const formatSelect = document.getElementById('formatSelect');
    const presetSelect = document.getElementById('presetSelect');
    const dropArea = document.getElementById('dropArea');
    const fileNamePatternInput = document.getElementById('fileNamePattern');

    let uploadedFiles = [];
    let resizedImagesData = [];

    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image.'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file.'));
            reader.readAsDataURL(file);
        });
    }

    async function drawAndGetResizedImage(image, originalFileName, targetWidth, targetHeight, format, index) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;

        if (format === 'image/jpeg') {
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        tempCtx.drawImage(image, 0, 0, targetWidth, targetHeight);

        return new Promise(resolve => {
            // Use maximum quality (1.0) for best image quality
            tempCanvas.toBlob(blob => {
                if (!blob) {
                    console.error('Failed to create Blob for image:', originalFileName);
                    resolve(null);
                    return;
                }
                const dataURL = URL.createObjectURL(blob);

                const imgItem = document.createElement('div');
                imgItem.className = 'resized-image-item';
                imgItem.dataset.index = index;

                const previewCanvas = document.createElement('canvas');
                const previewCtx = previewCanvas.getContext('2d');
                const previewMaxSize = 150;
                let pWidth = targetWidth;
                let pHeight = targetHeight;

                if (pWidth > previewMaxSize || pHeight > previewMaxSize) {
                    if (pWidth >= pHeight) {
                        pHeight = (pHeight / pWidth) * previewMaxSize;
                        pWidth = previewMaxSize;
                    } else {
                        pWidth = (pWidth / pHeight) * previewMaxSize;
                        pHeight = previewMaxSize;
                    }
                }
                previewCanvas.width = pWidth;
                previewCanvas.height = pHeight;
                previewCtx.drawImage(image, 0, 0, pWidth, pHeight);
                imgItem.appendChild(previewCanvas);

                const fileNameP = document.createElement('p');
                fileNameP.textContent = originalFileName;
                imgItem.appendChild(fileNameP);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'image-actions';

                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = 'Download';
                downloadBtn.onclick = () => downloadSingleImage(index);
                actionsDiv.appendChild(downloadBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'delete-btn';
                deleteBtn.onclick = () => deleteSingleImage(index);
                actionsDiv.appendChild(deleteBtn);

                imgItem.appendChild(actionsDiv);
                resizedImagesContainer.appendChild(imgItem);

                resolve({
                    fileName: originalFileName,
                    dataURL: dataURL,
                    blob: blob
                });
            }, format, 1.0); // Maximum quality
        });
    }

    async function processUploadedFiles(files) {
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (newFiles.length === 0) return;

        uploadedFiles.push(...newFiles);
        
        // Show and update file count display
        if (uploadedFiles.length > 0) {
            fileCountDisplay.textContent = `Selected ${uploadedFiles.length} image(s).`;
            fileCountDisplay.classList.remove('hidden');
        } else {
            fileCountDisplay.classList.add('hidden');
        }
        
        await triggerResize();
    }

    imageUpload.addEventListener('change', (event) => {
        processUploadedFiles(event.target.files);
        event.target.value = '';
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    dropArea.addEventListener('drop', (e) => {
        processUploadedFiles(e.dataTransfer.files);
    }, false);

    // Make drop area clickable to trigger file input
    dropArea.addEventListener('click', () => {
        imageUpload.click();
    });

    // Reset Settings functionality
    const resetSettingsButton = document.getElementById('resetSettings');
    if (resetSettingsButton) {
        resetSettingsButton.addEventListener('click', () => {
            // Reset all form inputs to default values
            widthInput.value = '';
            heightInput.value = '';
            presetSelect.value = '';
            formatSelect.value = 'image/png';
            fileNamePatternInput.value = '{name}-resized';
            
            // Reset aspect ratio lock to active
            const aspectRatioLock = document.getElementById('aspectRatioLock');
            if (aspectRatioLock) {
                aspectRatioLock.classList.add('active');
            }
            
            console.log('Settings reset to default values');
        });
    }

    async function triggerResize() {
        if (uploadedFiles.length === 0) {
            resizedImagesContainer.innerHTML = '<p class="placeholder-text">Upload images to start resizing!</p>';
            resizedImagesData = [];
            return;
        }

        resizedImagesContainer.innerHTML = '<h2>Resizing... Please wait...</h2>';
        const resizedPromises = [];
        const currentFormat = formatSelect.value;
        let inputWidth = parseInt(widthInput.value);
        let inputHeight = parseInt(heightInput.value);

        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            const promise = (async () => {
                try {
                    const img = await loadImage(file);
                    let finalWidth = inputWidth;
                    let finalHeight = inputHeight;

                    if (isNaN(inputWidth) && isNaN(inputHeight)) {
                        finalWidth = img.width;
                        finalHeight = img.height;
                    } else if (isNaN(inputWidth)) {
                        finalWidth = Math.round((img.width / img.height) * finalHeight);
                    } else if (isNaN(inputHeight)) {
                        finalHeight = Math.round((img.height / img.width) * finalWidth);
                    }

                    return await drawAndGetResizedImage(img, file.name, finalWidth, finalHeight, currentFormat, i);
                } catch (error) {
                    console.error(`Error processing ${file.name}:`, error);
                    return null;
                }
            })();
            resizedPromises.push(promise);
        }

        const results = await Promise.all(resizedPromises);
        resizedImagesData = results.filter(r => r !== null);

        const resizingHeading = resizedImagesContainer.querySelector('h2');
        if (resizingHeading) resizingHeading.remove();

        if (resizedImagesData.length === 0) {
            resizedImagesContainer.innerHTML = '<p class="placeholder-text">No images were successfully resized.</p>';
        }
    }

    resizeAllButton.addEventListener('click', triggerResize);

    presetSelect.addEventListener('change', () => {
        const selectedPreset = presetSelect.value;
        widthInput.value = "";
        heightInput.value = "";
        formatSelect.value = "image/png";

        if (selectedPreset === 'thumbnail') {
            widthInput.value = 80;
            heightInput.value = 80;
            formatSelect.value = "image/png";
        } else if (selectedPreset === 'graphicriver') {
            widthInput.value = 590;
            heightInput.value = "";
            formatSelect.value = "image/jpeg";
        } else if (selectedPreset === 'cover_envato') {
            widthInput.value = 2340;
            heightInput.value = 1560;
            formatSelect.value = "image/jpeg";
        }

        if (uploadedFiles.length > 0) {
            triggerResize();
        }
    });

    function getFinalFileName(originalName, index) {
        const pattern = fileNamePatternInput.value || '{name}-resized';
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        const extension = formatSelect.value === 'image/jpeg' ? 'jpeg' : 'png';
        
        let finalName = pattern.replace('{name}', baseName);
        finalName = finalName.replace('{n}', index + 1);

        return `${finalName}.${extension}`;
    }

    function downloadSingleImage(index) {
        const imageData = resizedImagesData[index];
        if (!imageData) return;

        const finalFileName = getFinalFileName(imageData.fileName, index);
        const a = document.createElement('a');
        a.href = imageData.dataURL;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function deleteSingleImage(index) {
        uploadedFiles.splice(index, 1);
        
        // Update file count display
        if (uploadedFiles.length > 0) {
            fileCountDisplay.textContent = `Selected ${uploadedFiles.length} image(s).`;
            fileCountDisplay.classList.remove('hidden');
        } else {
            fileCountDisplay.classList.add('hidden');
        }
        
        triggerResize(); 
    }

    downloadAllButton.addEventListener('click', () => {
        if (resizedImagesData.length === 0) {
            alert('No resized images to download.');
            return;
        }

        const zip = new JSZip();
        resizedImagesData.forEach((imageData, index) => {
            const finalFileName = getFinalFileName(imageData.fileName, index);
            zip.file(finalFileName, imageData.blob);
        });

        zip.generateAsync({ type: 'blob' }).then(content => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'resized-images.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    });

    formatSelect.addEventListener('change', () => {
        if (uploadedFiles.length > 0) {
            triggerResize();
        }
    });

    resizedImagesContainer.innerHTML = '<p class="placeholder-text">Upload images to start resizing!</p>';
});