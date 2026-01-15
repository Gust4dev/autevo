// heic2any é importado dinamicamente para evitar SSR errors (window is not defined)

/**
 * Detecta se o arquivo é HEIC/HEIF (formato padrão do iPhone)
 * IMPORTANTE: Não assumir HEIC baseado apenas em MIME vazio - isso causa falsos positivos
 */
function isHeicFile(file: File): boolean {
    // Verifica MIME type explícito
    const heicTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
    if (file.type && heicTypes.includes(file.type.toLowerCase())) {
        console.log('[isHeicFile] Detected HEIC via MIME type:', file.type);
        return true;
    }

    // Verifica extensão (mais confiável que MIME no iOS)
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'heic' || ext === 'heif') {
        console.log('[isHeicFile] Detected HEIC via extension:', ext);
        return true;
    }

    // NÃO assumir HEIC apenas porque MIME está vazio
    // O iOS envia JPEG com MIME vazio às vezes, e assumir HEIC causa erro
    console.log('[isHeicFile] Not HEIC (type:', file.type, ', ext:', ext, ')');
    return false;
}


/**
 * Converte arquivo HEIC para Blob JPEG
 */
async function convertHeicToJpeg(file: File): Promise<Blob> {
    try {
        console.log('[convertHeicToJpeg] Starting conversion...', { name: file.name, size: file.size });

        // Import dinâmico para evitar SSR errors
        const heic2any = (await import('heic2any')).default;

        const result = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.92,
        });
        const blob = Array.isArray(result) ? result[0] : result;
        console.log('[convertHeicToJpeg] Success, output size:', blob.size);
        return blob;
    } catch (error) {
        console.error('[convertHeicToJpeg] Failed:', error);
        throw new Error('Não foi possível converter a imagem HEIC. Tente tirar a foto novamente.');
    }
}

/**
 * Pré-processa o arquivo, convertendo HEIC para JPEG se necessário
 */
async function preprocessFile(file: File): Promise<File> {
    console.log('[preprocessFile] Input:', {
        name: file.name,
        type: file.type,
        size: file.size
    });

    // Se não é HEIC, retorna como está
    if (!isHeicFile(file)) {
        console.log('[preprocessFile] Not HEIC, returning original');
        return file;
    }

    console.log('[preprocessFile] Detected HEIC, converting...');

    try {
        const jpegBlob = await convertHeicToJpeg(file);
        const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg').replace(/\s/g, '_');
        const newFile = new File([jpegBlob], newName, { type: 'image/jpeg' });
        console.log('[preprocessFile] Conversion complete:', { newName, newSize: newFile.size });
        return newFile;
    } catch (error) {
        // Se falhar a conversão HEIC, tenta usar o arquivo original
        // Pode funcionar se for um JPEG disfarçado ou se o browser conseguir ler
        console.warn('[preprocessFile] HEIC conversion failed, trying original file:', error);
        return file;
    }
}

/**
 * Redimensiona imagem se necessário para evitar problemas de memória no iOS
 */
function getScaledDimensions(width: number, height: number, maxSize: number = 2048): { width: number; height: number } {
    if (width <= maxSize && height <= maxSize) {
        return { width, height };
    }

    if (width > height) {
        return {
            width: maxSize,
            height: Math.round((height * maxSize) / width)
        };
    } else {
        return {
            width: Math.round((width * maxSize) / height),
            height: maxSize
        };
    }
}

/**
 * Converte imagem para base64
 * Usa URL.createObjectURL (mais estável no Safari iOS) ao invés de FileReader
 * Fallback para JPEG quando WebP falha
 */
export async function convertFileToWebPBase64(file: File, quality = 0.7): Promise<string> {
    console.log('[convertFileToWebPBase64] Starting...', {
        name: file.name,
        type: file.type,
        size: file.size
    });

    // Pré-processa (converte HEIC se necessário)
    let processedFile: File;
    try {
        processedFile = await preprocessFile(file);
    } catch (error) {
        console.error('[convertFileToWebPBase64] Preprocessing failed:', error);
        throw new Error('Erro ao processar a imagem. Tente novamente.');
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(processedFile);

        // Timeout para evitar travamento no iOS
        const timeout = setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            console.error('[convertFileToWebPBase64] Timeout!');
            reject(new Error('Timeout ao carregar imagem. Tente com uma foto menor.'));
        }, 60000); // 60 segundos

        img.onload = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(objectUrl);

            try {
                console.log('[convertFileToWebPBase64] Image loaded:', {
                    width: img.width,
                    height: img.height
                });

                const canvas = document.createElement('canvas');

                // Redimensiona para max 1200px (menor = menor base64 = evita limite do Vercel)
                const { width, height } = getScaledDimensions(img.width, img.height, 1200);
                console.log('[convertFileToWebPBase64] Scaled dimensions:', { width, height });

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Erro ao criar canvas. Tente novamente.'));
                    return;
                }

                // Fundo branco para evitar transparência (importante para PNG -> JPEG)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, width, height);

                // Tenta WebP primeiro
                let base64 = canvas.toDataURL('image/webp', quality);
                console.log('[convertFileToWebPBase64] WebP result length:', base64.length);

                // Se WebP falhou (Safari antigo ou iOS problemático), usa JPEG
                if (!base64 || base64 === 'data:,' || base64.length < 1000) {
                    console.log('[convertFileToWebPBase64] WebP failed, falling back to JPEG');
                    base64 = canvas.toDataURL('image/jpeg', quality);
                    console.log('[convertFileToWebPBase64] JPEG result length:', base64.length);
                }

                // Verifica se o resultado é válido
                if (!base64 || base64 === 'data:,' || base64.length < 1000) {
                    console.error('[convertFileToWebPBase64] Both WebP and JPEG failed');
                    reject(new Error('Erro ao processar imagem. Tente com outra foto.'));
                    return;
                }

                // Verifica se o base64 tem formato válido
                if (!base64.startsWith('data:image/')) {
                    console.error('[convertFileToWebPBase64] Invalid base64 format:', base64.substring(0, 50));
                    reject(new Error('Formato de imagem inválido. Tente novamente.'));
                    return;
                }

                console.log('[convertFileToWebPBase64] Success! Output length:', base64.length);
                resolve(base64);
            } catch (error) {
                console.error('[convertFileToWebPBase64] Canvas error:', error);
                reject(new Error('Erro ao converter imagem. Tente novamente.'));
            }
        };

        img.onerror = (event) => {
            clearTimeout(timeout);
            URL.revokeObjectURL(objectUrl);
            console.error('[convertFileToWebPBase64] Image load error:', event);
            reject(new Error('Não foi possível carregar a imagem. Verifique se é uma foto válida.'));
        };

        // Usa Object URL ao invés de FileReader (mais estável no Safari iOS)
        img.src = objectUrl;
    });
}



/**
 * Converte arquivo para WebP File (para upload via FormData)
 */
export async function convertFileToWebP(file: File, quality = 0.8): Promise<File> {
    console.log('[convertFileToWebP] Starting...', { name: file.name, type: file.type, size: file.size });

    const processedFile = await preprocessFile(file);

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(processedFile);

        // Timeout
        const timeout = setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Timeout ao processar imagem.'));
        }, 60000);

        img.onload = () => {
            clearTimeout(timeout);
            try {
                const canvas = document.createElement('canvas');

                // Redimensiona se necessário
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

                // Tenta WebP primeiro
                canvas.toBlob(
                    (blob) => {
                        if (blob && blob.size > 0) {
                            URL.revokeObjectURL(objectUrl);
                            const newName = processedFile.name.replace(/\.[^/.]+$/, '').replace(/\s/g, '_') + '.webp';
                            const newFile = new File([blob], newName, { type: 'image/webp' });
                            console.log('[convertFileToWebP] WebP success:', newFile.size);
                            resolve(newFile);
                        } else {
                            // Fallback para JPEG
                            console.log('[convertFileToWebP] WebP failed, trying JPEG');
                            canvas.toBlob(
                                (jpegBlob) => {
                                    URL.revokeObjectURL(objectUrl);
                                    if (jpegBlob && jpegBlob.size > 0) {
                                        const newName = processedFile.name.replace(/\.[^/.]+$/, '').replace(/\s/g, '_') + '.jpg';
                                        const newFile = new File([jpegBlob], newName, { type: 'image/jpeg' });
                                        console.log('[convertFileToWebP] JPEG fallback success:', newFile.size);
                                        resolve(newFile);
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

/**
 * Converte URL de imagem para base64 PNG
 */
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
                const base64 = canvas.toDataURL('image/png');
                resolve(base64);
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
