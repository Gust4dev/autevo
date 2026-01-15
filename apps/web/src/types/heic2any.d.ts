declare module 'heic2any' {
    interface HeicConvertOptions {
        blob: Blob;
        toType?: 'image/jpeg' | 'image/png' | 'image/gif';
        quality?: number;
        multiple?: boolean;
    }

    function heic2any(options: HeicConvertOptions): Promise<Blob | Blob[]>;

    export default heic2any;
}
