function isHeicFile(file: File): boolean {
    const heicTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
    if (file.type && heicTypes.includes(file.type.toLowerCase())) {
        return true;
    }
    const ext = file.name.toLowerCase().split('.').pop();
    return ext === 'heic' || ext === 'heif';
}

async function convertHeicToJpeg(file: File): Promise<Blob> {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92,
    });
    return Array.isArray(result) ? result[0] : result;
}

async function preprocessFile(file: File): Promise<File> {
    if (!isHeicFile(file)) {
        return file;
    }

    try {
        const jpegBlob = await convertHeicToJpeg(file);
        const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg').replace(/\s/g, '_');
        return new File([jpegBlob], newName, { type: 'image/jpeg' });
    } catch {
        return file;
    }
}

function getScaledDimensions(width: number, height: number, maxSize: number): { width: number; height: number } {
    if (width <= maxSize && height <= maxSize) {
        return { width, height };
    }

    if (width > height) {
        return {
            width: maxSize,
            height: Math.round((height * maxSize) / width)
        };
    }
    return {
        width: Math.round((width * maxSize) / height),
        height: maxSize
    };
}

export async function convertFileToWebPBase64(
    file: File,
    quality = 0.7,
    watermark?: string,
): Promise<string> {
    const processedFile = await preprocessFile(file);

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(processedFile);

        const timeout = setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Timeout ao carregar imagem. Tente com uma foto menor.'));
        }, 60000);

        img.onload = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(objectUrl);

            try {
                const canvas = document.createElement('canvas');
                const { width, height } = getScaledDimensions(img.width, img.height, 1200);

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Erro ao criar canvas. Tente novamente.'));
                    return;
                }

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, width, height);

                // 🔏 WATERMARK: Stamp OS code + timestamp for legal evidence
                if (watermark) {
                    const now = new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                    }).format(new Date());
                    const text = `${watermark} · ${now}`;

                    const fontSize = Math.max(12, Math.round(width * 0.022));
                    ctx.font = `bold ${fontSize}px monospace`;

                    const padding = Math.round(fontSize * 0.6);
                    const textWidth = ctx.measureText(text).width;
                    const boxH = fontSize + padding * 2;
                    const boxW = textWidth + padding * 2;
                    const x = width - boxW - padding;
                    const y = height - boxH - padding;

                    // Semi-transparent background
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                    ctx.beginPath();
                    ctx.roundRect(x, y, boxW, boxH, 4);
                    ctx.fill();

                    // Text
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.fillText(text, x + padding, y + padding + fontSize * 0.85);
                }

                let base64 = canvas.toDataURL('image/webp', quality);

                if (!base64 || base64 === 'data:,' || base64.length < 1000) {
                    base64 = canvas.toDataURL('image/jpeg', quality);
                }

                if (!base64 || base64 === 'data:,' || base64.length < 1000) {
                    reject(new Error('Erro ao processar imagem. Tente com outra foto.'));
                    return;
                }

                if (!base64.startsWith('data:image/')) {
                    reject(new Error('Formato de imagem inválido. Tente novamente.'));
                    return;
                }

                resolve(base64);
            } catch {
                reject(new Error('Erro ao converter imagem. Tente novamente.'));
            }
        };

        img.onerror = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível carregar a imagem. Verifique se é uma foto válida.'));
        };

        img.src = objectUrl;
    });
}

export async function convertFileToWebP(file: File, quality = 0.8): Promise<File> {
    const processedFile = await preprocessFile(file);

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(processedFile);

        const timeout = setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Timeout ao processar imagem.'));
        }, 60000);

        img.onload = () => {
            clearTimeout(timeout);
            try {
                const canvas = document.createElement('canvas');
                const { width, height } = getScaledDimensions(img.width, img.height, 2048);

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('Não foi possível criar o contexto do canvas'));
                    return;
                }

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob && blob.size > 0) {
                            URL.revokeObjectURL(objectUrl);
                            const newName = processedFile.name.replace(/\.[^/.]+$/, '').replace(/\s/g, '_') + '.webp';
                            resolve(new File([blob], newName, { type: 'image/webp' }));
                        } else {
                            canvas.toBlob(
                                (jpegBlob) => {
                                    URL.revokeObjectURL(objectUrl);
                                    if (jpegBlob && jpegBlob.size > 0) {
                                        const newName = processedFile.name.replace(/\.[^/.]+$/, '').replace(/\s/g, '_') + '.jpg';
                                        resolve(new File([jpegBlob], newName, { type: 'image/jpeg' }));
                                    } else {
                                        reject(new Error('Falha na conversão. Tente com outra imagem.'));
                                    }
                                },
                                'image/jpeg',
                                quality
                            );
                        }
                    },
                    'image/webp',
                    quality
                );
            } catch (error) {
                URL.revokeObjectURL(objectUrl);
                reject(error);
            }
        };

        img.onerror = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível carregar a imagem.'));
        };

        img.src = objectUrl;
    });
}

export async function convertUrlToPngBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        const timeout = setTimeout(() => {
            reject(new Error('Timeout ao carregar imagem.'));
        }, 30000);

        img.onload = () => {
            clearTimeout(timeout);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = (e) => {
            clearTimeout(timeout);
            reject(e);
        };

        img.src = url;
    });
}
