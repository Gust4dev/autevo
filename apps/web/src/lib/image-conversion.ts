import heic2any from 'heic2any';

/**
 * Detecta se o arquivo é HEIC/HEIF (formato padrão do iPhone)
 */
function isHeicFile(file: File): boolean {
    const heicTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
    if (heicTypes.includes(file.type.toLowerCase())) return true;
    const ext = file.name.toLowerCase().split('.').pop();
    return ext === 'heic' || ext === 'heif';
}

/**
 * Converte arquivo HEIC para Blob JPEG
 */
async function convertHeicToBlob(file: File): Promise<Blob> {
    const result = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92,
    });
    return Array.isArray(result) ? result[0] : result;
}

/**
 * Pré-processa o arquivo, convertendo HEIC para JPEG se necessário
 */
async function preprocessFile(file: File): Promise<File> {
    if (!isHeicFile(file)) {
        return file;
    }

    const jpegBlob = await convertHeicToBlob(file);
    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([jpegBlob], newName, { type: 'image/jpeg' });
}

export async function convertFileToWebP(file: File, quality = 0.8): Promise<File> {
    const processedFile = await preprocessFile(file);

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(processedFile);

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('Não foi possível criar o contexto do canvas'));
                    return;
                }

                if (processedFile.type === 'image/png') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(objectUrl);

                        if (blob) {
                            const newName = processedFile.name.replace(/\.[^/.]+$/, '') + '.webp';
                            const newFile = new File([blob], newName, { type: 'image/webp' });
                            resolve(newFile);
                        } else {
                            reject(new Error('Falha na conversão para WebP. Tente com outro formato de imagem.'));
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
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Não foi possível carregar a imagem. Verifique se o arquivo é válido.'));
        };

        img.src = objectUrl;
    });
}

export async function convertFileToWebPBase64(file: File, quality = 0.8): Promise<string> {
    const processedFile = await preprocessFile(file);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const img = new Image();

            img.onload = () => {
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
                    const base64 = canvas.toDataURL('image/webp', quality);

                    if (base64 === 'data:,') {
                        const jpegBase64 = canvas.toDataURL('image/jpeg', quality);
                        resolve(jpegBase64);
                    } else {
                        resolve(base64);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error('Não foi possível carregar a imagem. Tente novamente.'));
            };

            img.src = reader.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Erro ao ler o arquivo. Tente novamente.'));
        };

        reader.readAsDataURL(processedFile);
    });
}

export async function convertUrlToPngBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
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
        };
        img.onerror = (e) => {
            reject(e);
        };
    });
}
