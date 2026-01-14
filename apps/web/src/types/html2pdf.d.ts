declare module 'html2pdf.js' {
    interface Html2PdfOptions {
        margin?: number | [number, number, number, number];
        filename?: string;
        image?: {
            type?: 'jpeg' | 'png' | 'webp';
            quality?: number;
        };
        html2canvas?: {
            scale?: number;
            useCORS?: boolean;
            letterRendering?: boolean;
            logging?: boolean;
        };
        jsPDF?: {
            unit?: 'pt' | 'mm' | 'cm' | 'in';
            format?: 'a4' | 'letter' | 'legal' | [number, number];
            orientation?: 'portrait' | 'landscape';
        };
        pagebreak?: {
            mode?: 'avoid-all' | 'css' | 'legacy';
            before?: string[];
            after?: string[];
            avoid?: string[];
        };
    }

    interface Html2Pdf {
        set(options: Html2PdfOptions): Html2Pdf;
        from(element: HTMLElement | string): Html2Pdf;
        save(): Promise<void>;
        output(type: 'blob' | 'datauristring' | 'arraybuffer' | 'bloburl'): Promise<Blob | string | ArrayBuffer>;
        toPdf(): Html2Pdf;
    }

    function html2pdf(): Html2Pdf;
    function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Html2Pdf;

    export = html2pdf;
}
